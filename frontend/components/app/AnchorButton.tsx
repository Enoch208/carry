"use client";

import { useState } from "react";
import { GradientButton } from "@/components/ui/Buttons";
import { Badge } from "@/components/ui/Badge";
import { Icon, AnchorIcon, VerifiedIcon } from "@/components/icons";
import { anchorReceipt } from "@/lib/api";
import type { AnswerReceipt } from "@/lib/types";

type AnchorButtonProps = {
  receipt: AnswerReceipt;
};

type AnchorState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; blobId: string }
  | { status: "error" };

export function AnchorButton({ receipt }: AnchorButtonProps) {
  const [state, setState] = useState<AnchorState>({ status: "idle" });

  async function handleClick() {
    if (state.status === "pending" || state.status === "done") return;
    setState({ status: "pending" });
    try {
      const { blobId } = await anchorReceipt(receipt);
      setState({ status: "done", blobId });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <GradientButton
        size="sm"
        onClick={() => { void handleClick(); }}
        className={state.status === "pending" || state.status === "done" ? "pointer-events-none opacity-60" : ""}
      >
        <Icon icon={AnchorIcon} size={15} aria-hidden />
        {state.status === "pending" ? "Anchoring…" : "Anchor on Walrus"}
      </GradientButton>

      {state.status === "done" && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">blob:{state.blobId}</span>
          <Badge variant="success">
            <Icon icon={VerifiedIcon} size={13} aria-hidden />
            Verified
          </Badge>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-xs text-danger">Anchor failed — try again</p>
      )}
    </div>
  );
}
