import React from "react";

export const VersionFooter = () => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
    // Determine environment:
    // If we are on localhost, it's likely dev (or manual local build).
    // Ideally, valid NODE_ENV usage or specific env var is better.
    // But NEXT_PUBLIC_API_URL can hint at it.

    // A simple heuristic:
    const isProduction = process.env.NODE_ENV === "production";

    // If we want to distinguish "Local Dev" vs "NAS Production", we can check API URL or just use NODE_ENV.
    // Let's use a cleaner label.
    let envLabel = "Local Dev";
    if (isProduction) {
        envLabel = "Production";
    }

    return (
        <div className="fixed bottom-2 left-2 z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border">
                v{version} ({envLabel})
            </span>
        </div>
    );
};
