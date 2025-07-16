"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useChatContext } from "./user-chat-context";
import { onGetConversationMode, onToggleRealtime } from "@/action/conversation";
import path from "path";
import { useClerk } from "@clerk/nextjs";

const useSideBar = () => {
  const [expand, setExpand] = useState<boolean | undefined>(undefined);
  const [realtime, setRealtime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { chatRoom } = useChatContext();

  const onActivateRealTime = async (e: any) => {
    try {
      const realtime = await onToggleRealtime(
        chatRoom!,
        e.target.ariaChecked === "true" ? false : true
      );
      if (realtime) {
        setRealtime(realtime.chatRoom.live);
        toast({
          title: "Éxito",
          description: realtime.message,
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const onGetCurrentMode = useCallback(async () => {
    setLoading(true);
    const mode = await onGetConversationMode(chatRoom!);
    if (mode) {
      setRealtime(mode.live);
      setLoading(false);
    }
  }, [chatRoom]);

  useEffect(() => {
    if (chatRoom) {
      onGetCurrentMode();
    }
  }, [chatRoom, onGetCurrentMode]);

  const page = pathname.split("/").pop();

  const { signOut } = useClerk();

  const onSignOut = () => signOut(() => router.push("/"));

  const onExpand = () => setExpand((prev) => !prev);

  return {
    expand,
    onExpand,
    page,
    onSignOut,
    realtime,
    onActivateRealTime,
    chatRoom,
    loading,
  };
};

export default useSideBar;
