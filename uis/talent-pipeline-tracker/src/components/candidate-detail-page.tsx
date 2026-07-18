"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCandidateNote,
  deleteCandidateNote,
  getCandidateById,
  getCandidateNotes,
  patchCandidate,
  updateCandidate,
} from "@/src/services/api";
import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
  CreateNoteInput,
  Note,
  UpdateCandidateInput,
} from "@/src/types";

interface CandidateDetailPageProps {
  id: string;
}

const statusOptions: CandidateStatus[] = ["aplicado", "en-proceso", "contratado", "rechazado"];
const stageOptions: CandidateStage[] = [
  "screening",
  "entrevista-rrhh",
  "entrevista-tecnica",
  "entrevista-final",
  "oferta",
  "hired",
  "descartado",
];

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function CandidateDetailPage({ id }: CandidateDetailPageProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | number | null>(null);

  const [newNoteText, setNewNoteText] = useState("");

  const [editForm, setEditForm] = useState<UpdateCandidateInput>({
    nombre: "",
    email: "",
    telefono: "",
    puesto: "",
    linkedinUrl: "",
    cvUrl: "",
    aniosExperiencia: 0,
    estado: "aplicado",
    etapa: "screening",
    fechaAplicacion: new Date().toISOString(),
  });

  const requiredInvalid = useMemo(() => {
    return (
      editForm.nombre.trim().length === 0 ||
      editForm.email.trim().length === 0 ||
      editForm.telefono.trim().length === 0 ||
      editForm.puesto.trim().length === 0
    );
  }, [editForm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [candidateResponse, notesResponse] = await Promise.all([
        getCandidateById(id),
        getCandidateNotes(id),
      ]);

      setCandidate(candidateResponse);
      setNotes(notesResponse);
      setEditForm({
        nombre: candidateResponse.nombre,
        email: candidateResponse.email,
        telefono: candidateResponse.telefono,
        puesto: candidateResponse.puesto,
        linkedinUrl: candidateResponse.linkedinUrl,
        cvUrl: candidateResponse.cvUrl,
        aniosExperiencia: candidateResponse.aniosExperiencia,
        estado: candidateResponse.estado,
        etapa: candidateResponse.etapa,
        fechaAplicacion: candidateResponse.fechaAplicacion,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar el detalle.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function handleStatusChange(nextStatus: CandidateStatus) {
    if (!candidate) return;

    setActionMessage(null);
    setActionError(null);
    setUpdatingStatus(true);

    try {
      const updated = await patchCandidate(candidate.id, { estado: nextStatus });
      setCandidate(updated);
      setEditForm((prev) => ({ ...prev, estado: updated.estado }));
      setActionMessage("Estado actualizado correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el estado.";
      setActionError(message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleStageChange(nextStage: CandidateStage) {
    if (!candidate) return;

    setActionMessage(null);
    setActionError(null);
    setUpdatingStage(true);

    try {
      const updated = await patchCandidate(candidate.id, { etapa: nextStage });
      setCandidate(updated);
      setEditForm((prev) => ({ ...prev, etapa: updated.etapa }));
      setActionMessage("Etapa actualizada correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la etapa.";
      setActionError(message);
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleSubmitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage(null);
    setActionError(null);

    if (requiredInvalid || !candidate) {
      setActionError("Completa los campos obligatorios antes de guardar.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const updated = await updateCandidate(candidate.id, {
        ...editForm,
        nombre: editForm.nombre.trim(),
        email: editForm.email.trim(),
        telefono: editForm.telefono.trim(),
        puesto: editForm.puesto.trim(),
        linkedinUrl: editForm.linkedinUrl.trim(),
        cvUrl: editForm.cvUrl.trim(),
      });

      setCandidate(updated);
      setEditForm({
        nombre: updated.nombre,
        email: updated.email,
        telefono: updated.telefono,
        puesto: updated.puesto,
        linkedinUrl: updated.linkedinUrl,
        cvUrl: updated.cvUrl,
        aniosExperiencia: updated.aniosExperiencia,
        estado: updated.estado,
        etapa: updated.etapa,
        fechaAplicacion: updated.fechaAplicacion,
      });
      setIsEditOpen(false);
      setActionMessage("Candidatura actualizada correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la candidatura.";
      setActionError(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleAddNote() {
    if (!candidate) return;

    const content = newNoteText.trim();
    if (!content) {
      setActionError("La nota no puede estar vacia.");
      return;
    }

    setActionMessage(null);
    setActionError(null);
    setIsAddingNote(true);

    try {
      const payload: CreateNoteInput = { texto: content };
      const created = await addCandidateNote(candidate.id, payload);
      setNotes((prev) => [created, ...prev]);
      setNewNoteText("");
      setActionMessage("Nota agregada correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la nota.";
      setActionError(message);
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string | number) {
    if (!candidate) return;

    setActionMessage(null);
    setActionError(null);
    setDeletingNoteId(noteId);

    try {
      await deleteCandidateNote(candidate.id, noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setActionMessage("Nota eliminada correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar la nota.";
      setActionError(message);
    } finally {
      setDeletingNoteId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
        <div className="h-60 animate-pulse rounded-3xl border border-slate-200 bg-slate-200/70" />
      </main>
    );
  }

  if (error || !candidate) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
        <Link href="/" className="text-sm font-medium text-sky-700 hover:underline">
          Volver al listado
        </Link>
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
          {error ?? "No se encontro la candidatura solicitada."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-sky-700 hover:underline">
          Volver al listado
        </Link>
        <button
          type="button"
          onClick={() => setIsEditOpen((prev) => !prev)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {isEditOpen ? "Cerrar edicion" : "Editar candidatura"}
        </button>
      </div>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{candidate.nombre}</h1>
        <p className="mt-1 text-sm text-slate-600">{candidate.puesto}</p>

        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Email:</span> {candidate.email}</p>
          <p><span className="font-semibold">Telefono:</span> {candidate.telefono}</p>
          <p>
            <span className="font-semibold">LinkedIn:</span>{" "}
            {candidate.linkedinUrl ? (
              <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                Ver perfil
              </a>
            ) : (
              "No disponible"
            )}
          </p>
          <p>
            <span className="font-semibold">CV:</span>{" "}
            {candidate.cvUrl ? (
              <a href={candidate.cvUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                Abrir CV
              </a>
            ) : (
              "No disponible"
            )}
          </p>
          <p><span className="font-semibold">Experiencia:</span> {candidate.aniosExperiencia} anos</p>
          <p><span className="font-semibold">Fecha aplicacion:</span> {formatDate(candidate.fechaAplicacion)}</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Estado</span>
            <select
              value={candidate.estado}
              disabled={updatingStatus}
              onChange={(event) => void handleStatusChange(event.target.value as CandidateStatus)}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Etapa</span>
            <select
              value={candidate.etapa}
              disabled={updatingStage}
              onChange={(event) => void handleStageChange(event.target.value as CandidateStage)}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
            >
              {stageOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>

        {actionMessage && <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p>}
        {actionError && <p className="mt-3 text-sm text-rose-700">{actionError}</p>}
      </section>

      {isEditOpen && (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Edicion completa</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmitEdit}>
            <input
              required
              value={editForm.nombre}
              onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="Nombre completo"
            />
            <input
              required
              type="email"
              value={editForm.email}
              onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="Correo"
            />
            <input
              required
              value={editForm.telefono}
              onChange={(event) => setEditForm((prev) => ({ ...prev, telefono: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="Telefono"
            />
            <input
              required
              value={editForm.puesto}
              onChange={(event) => setEditForm((prev) => ({ ...prev, puesto: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="Puesto"
            />
            <input
              value={editForm.linkedinUrl}
              onChange={(event) => setEditForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="LinkedIn URL"
            />
            <input
              value={editForm.cvUrl}
              onChange={(event) => setEditForm((prev) => ({ ...prev, cvUrl: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="CV URL"
            />
            <input
              type="number"
              min={0}
              value={String(editForm.aniosExperiencia)}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  aniosExperiencia: Number(event.target.value || 0),
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
              placeholder="Anios de experiencia"
            />
            <input
              type="datetime-local"
              value={editForm.fechaAplicacion.slice(0, 16)}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  fechaAplicacion: new Date(event.target.value).toISOString(),
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
            />

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={requiredInvalid || isSavingEdit}
                className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notas</h2>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newNoteText}
            onChange={(event) => setNewNoteText(event.target.value)}
            placeholder="Escribe una nota de seguimiento..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring"
          />
          <button
            type="button"
            onClick={() => void handleAddNote()}
            disabled={isAddingNote}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingNote ? "Guardando" : "Agregar"}
          </button>
        </div>

        <ul className="mt-4 grid gap-2">
          {notes.length === 0 && (
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              Aun no hay notas registradas.
            </li>
          )}

          {notes.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-sm text-slate-800">{note.texto}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(note.createdAt)}</p>
              </div>

              <button
                type="button"
                aria-label="Eliminar nota"
                onClick={() => void handleDeleteNote(note.id)}
                disabled={deletingNoteId === note.id}
                className="rounded-md p-2 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
