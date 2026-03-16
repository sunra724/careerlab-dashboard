import AttendClient from "./AttendClient";

export default function AttendPage({
  params,
}: {
  params: { sessionType: string; sessionId: string };
}) {
  return (
    <AttendClient
      sessionId={params.sessionId}
      sessionType={params.sessionType}
    />
  );
}
