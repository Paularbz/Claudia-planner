"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ContentRef, ContentRefNetwork } from "@/types";

function rowToRef(row: Record<string, unknown>): ContentRef {
  return {
    id: row.id as number,
    title: row.title as string,
    url: row.url as string,
    network: row.network as ContentRefNetwork,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function useContentRefs(network?: ContentRefNetwork | "all") {
  const [refs, setRefs] = useState<ContentRef[]>([]);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("content_refs")
      .select("*")
      .order("created_at", { ascending: false });

    if (network && network !== "all") query = query.eq("network", network);

    const { data } = await query;
    if (data) setRefs(data.map(rowToRef));
  }, [network]);

  useEffect(() => { fetch(); }, [fetch]);

  async function createRef(data: Omit<ContentRef, "id" | "createdAt">) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("content_refs").insert({
      user_id: user?.id,
      title: data.title,
      url: data.url,
      network: data.network,
      notes: data.notes,
    });
    fetch();
  }

  async function deleteRef(id: number) {
    await supabase.from("content_refs").delete().eq("id", id);
    fetch();
  }

  return { refs, createRef, deleteRef };
}
