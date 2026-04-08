interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <div className="bg-portal-card border border-portal-border rounded-lg p-5 shadow-sm space-y-3">
      <h4 className="text-portal-heading text-[22px] font-bold font-mono uppercase tracking-wider">
        🎬 Test Recording
      </h4>
      <div className="rounded-lg overflow-hidden border border-portal-border bg-black">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full"
          style={{ maxHeight: "480px" }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <p className="text-portal-muted text-xs">
        Recorded during headed test execution. Use the controls to replay.
      </p>
    </div>
  );
}
