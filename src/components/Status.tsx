import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import { formatTimeAgo } from "../format-time-ago";
import { Alert } from "react-bootstrap";
import { SmallButton } from "./design/Button";
import { Core } from "../state/core";

export interface StatusProps {
  core: Core;
}

const StatusContainer = styled.div`
  flex-grow: 1;
`;

export const Status = observer((props: StatusProps) => {
  let lastUpdated;
  if (props.core.loadedState && props.core.loadedState.startRefreshTimestamp) {
    lastUpdated = (
      <div>
        Last updated{" "}
        {formatTimeAgo(props.core.loadedState.startRefreshTimestamp)}
        {". "}
        {props.core.refreshing ? (
          "Refreshing..."
        ) : (
          <SmallButton
            onClick={() => {
              props.core.triggerBackgroundRefresh();
            }}
          >
            Refresh
          </SmallButton>
        )}
      </div>
    );
  }
  return (
    <StatusContainer>
      {props.core.lastError ? (
        <Alert variant="danger">
          <div>Error: {props.core.lastError}</div>
          {lastUpdated}
        </Alert>
      ) : (
        <Alert variant="info">
          {lastUpdated ||
            (props.core.refreshing ? "Loading..." : "Welcome to PR Monitor!")}
        </Alert>
      )}
    </StatusContainer>
  );
});
