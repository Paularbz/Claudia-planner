"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button } from "@/components/ui/Button";

const CalendarView = dynamic(
  () => import("@/components/calendar/CalendarView").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={28} className="animate-spin text-purple-500" />
      </div>
    ),
  }
);

export default function CalendarPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [initialTime, setInitialTime] = useState<string | undefined>();

  function openCreate(date?: string, time?: string) {
    setEditTaskId(null);
    setInitialDate(date);
    setInitialTime(time);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 md:block hidden">Calendário</h1>
        <Button onClick={() => openCreate()} size="sm" className="ml-auto">
          <Plus size={16} /> Nova tarefa
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <CalendarView
          onEventClick={(taskId) => {
            setEditTaskId(taskId);
            setInitialDate(undefined);
            setInitialTime(undefined);
            setModalOpen(true);
          }}
          onDateClick={openCreate}
        />
      </div>

      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTaskId(null); }}
        taskId={editTaskId}
        initialDate={initialDate}
        initialStartTime={initialTime}
      />
    </div>
  );
}
