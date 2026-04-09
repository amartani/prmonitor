import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import { GitHubApi } from "./api";
import { GraphQLClient, gql } from "graphql-request";

const ThrottledOctokit = Octokit.plugin(throttling);
const graphQLEndpoint = "https://api.github.com/graphql";

/** Only include PRs whose last activity (GitHub `updated` field) is within this window. */
const PULL_REQUEST_SEARCH_MAX_AGE_DAYS = 90;

function pullRequestSearchUpdatedSince(): string {
  const cutoff = new Date(
    Date.now() - PULL_REQUEST_SEARCH_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  );
  return cutoff.toISOString().slice(0, 10);
}

export function buildGitHubApi(token: string): GitHubApi {
  const octokit: Octokit = new ThrottledOctokit({
    auth: `token ${token}`,
    // https://developer.github.com/v3/pulls/#list-pull-requests
    // Enable Draft Pull Request API.
    previews: ["shadow-cat"],
    throttle: {
      onRateLimit: (retryAfter, options, _octokit, retryCount) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        // Only retry twice.
        if (retryCount < 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (retryAfter, options, _octokit, retryCount) => {
        console.warn(
          `Secondary Rate Limit detected for request ${options.method} ${options.url}`
        );
        // Only retry twice.
        if (retryCount < 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
        return false;
      },
    },
  });

  const graphQLClient = new GraphQLClient(graphQLEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fetch: globalThis.fetch,
  });

  return {
    async loadAuthenticatedUser() {
      const response = await octokit.users.getAuthenticated({});
      return response.data;
    },
    searchPullRequests(query) {
      const updatedSince = pullRequestSearchUpdatedSince();
      return octokit.paginate(
        octokit.search.issuesAndPullRequests.endpoint.merge({
          q: `is:pr ${query} updated:>${updatedSince}`,
        })
      );
    },
    async loadPullRequestDetails(pr) {
      const response = await octokit.pulls.get({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        pull_number: pr.number,
      });
      return response.data;
    },
    loadReviews(pr) {
      return octokit.paginate(
        octokit.pulls.listReviews.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
        })
      );
    },
    loadComments(pr) {
      return octokit.paginate(
        octokit.issues.listComments.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          issue_number: pr.number,
        })
      );
    },
    loadCommits(pr) {
      return octokit.paginate(
        octokit.pulls.listCommits.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
        })
      );
    },
    loadPullRequestStatus(pr) {
      const query = gql`
        query {
          repository(owner: "${pr.repo.owner}", name: "${pr.repo.name}") {
            pullRequest(number: ${pr.number}) {
              reviewDecision
              commits(last: 1) {
                nodes {
                  commit {
                    statusCheckRollup {
                      state
                    }
                  }
                }
              }
            }
          }
        }
      `;

      return graphQLClient.request(query).then((response) => {
        const result = response.repository.pullRequest;
        const reviewDecision = result.reviewDecision;
        const checkStatus =
          result.commits.nodes?.[0]?.commit.statusCheckRollup?.state;
        return {
          reviewDecision,
          checkStatus,
        };
      });
    },
  };
}
