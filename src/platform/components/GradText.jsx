import { grad } from "../constants/theme";

export default function GradText({ children }) {
  return <span style={{ background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{children}</span>;
}
