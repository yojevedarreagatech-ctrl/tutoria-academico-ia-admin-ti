import type { ChatSource } from "@/types/chat";

export type VoiceConnectionStatus = "disconnected" | "connecting" | "connected";
export type VoiceAgentPhase = "idle" | "listening" | "processing" | "speaking" | "stopped";

type VoicePracticeState = "idle" | "awaiting_answer";

export type VoiceAgentEvent =
  | { type: "session_started"; conversation_id?: number | null; practice_state?: VoicePracticeState }
  | { type: "listening"; turn_id?: string; practice_state?: VoicePracticeState }
  | { type: "partial_transcript"; turn_id?: string; text: string }
  | { type: "final_transcript"; turn_id?: string; text: string }
  | { type: "agent_thinking"; turn_id?: string }
  | {
      type: "agent_response_text";
      turn_id?: string;
      conversation_id: number;
      text: string;
      sources: ChatSource[];
      practice_state?: VoicePracticeState;
      intent?: string;
      action?: string;
    }
  | { type: "agent_response_audio"; turn_id?: string; audio_base64: string; mime_type?: string; practice_state?: VoicePracticeState }
  | { type: "agent_finished_speaking"; turn_id?: string; practice_state?: VoicePracticeState }
  | { type: "listening_again"; turn_id?: string; practice_state?: VoicePracticeState }
  | { type: "error"; turn_id?: string; message: string }
  | { type: "session_finished"; practice_state?: VoicePracticeState };
