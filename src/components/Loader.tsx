import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import { ClipLoader } from "react-spinners";
import { Center } from "./design/Center";

const PaddedCenter = styled(Center)`
  padding: 16px;
`;

export const Loader = observer(() => (
  <PaddedCenter>
    <ClipLoader />
  </PaddedCenter>
));
