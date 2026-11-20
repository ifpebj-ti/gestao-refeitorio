"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  FileText,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Download,
  Printer,
  Edit2,
  Eye,
  AlertCircle,
  X,
  Upload,
  Power,
  RotateCcw,
} from "lucide-react";
import {
  listarNotas,
  buscarNotaPorId,
  listarEntradasDisponiveisNota,
  registrarNota,
  emitirNotaLocal,
  editarNotaPendente,
  validarNota,
  cancelarNota,
  anexarDocumentoNota,
  baixarDocumentoNota,
  NotaResumoDTO,
  NotaResponseDTO,
  NotaEntradaDTO,
  StatusNota,
  TipoNota,
} from "@/lib/notas";
import {
  listarRemetentes,
  cadastrarRemetente,
  editarRemetente,
  inativarRemetente,
  reativarRemetente,
  RemetenteDTO,
} from "@/lib/remetentes";

type AbaAtiva = "NOTAS" | "REMETENTES";

function validarDocumentoCpfCnpj(doc: string): boolean {
  const limpo = doc.replace(/\D/g, "");
  if (limpo.length === 0) return true;
  return limpo.length === 11 || limpo.length === 14;
}

export default function GestaoNotasPage() {
  const router = useRouter();
  const { autenticado, carregando, perfil } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("NOTAS");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // ── Estados de Notas ──
  const [notas, setNotas] = useState<NotaResumoDTO[]>([]);
  const [filtroStatusNota, setFiltroStatusNota] = useState<StatusNota | "">("");
  const [filtroTipoNota, setFiltroTipoNota] = useState<TipoNota | "">("");
  const [filtroRemetenteId, setFiltroRemetenteId] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");

  // ── Estados de Remetentes ──
  const [remetentes, setRemetentes] = useState<RemetenteDTO[]>([]);
  const [filtroAtivoRemetente, setFiltroAtivoRemetente] = useState<string>("TODOS");
  const [buscaRemetente, setBuscaRemetente] = useState<string>("");

  // ── Modais de Nota (Criar Externa / Editar Pendente / Emitir Local / Detalhe / Cancelar) ──
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [modoModalNota, setModoModalNota] = useState<"EXTERNA" | "LOCAL" | "EDITAR">("EXTERNA");
  const [notaEmEdicaoId, setNotaEmEdicaoId] = useState<string | null>(null);
  const [entradasDisponiveis, setEntradasDisponiveis] = useState<NotaEntradaDTO[]>([]);
  const [formNumeroNota, setFormNumeroNota] = useState("");
  const [formDataNota, setFormDataNota] = useState(() => new Date().toISOString().split("T")[0]);
  const [formRemetenteNotaId, setFormRemetenteNotaId] = useState("");
  const [formResponsavelEntrega, setFormResponsavelEntrega] = useState("");
  const [formObservacoesNota, setFormObservacoesNota] = useState("");
  const [formMovimentacaoIds, setFormMovimentacaoIds] = useState<string[]>([]);
  const [formArquivoNota, setFormArquivoNota] = useState<File | null>(null);

  const [notaDetalhe, setNotaDetalhe] = useState<NotaResponseDTO | null>(null);
  const [exibindoComprovanteImpressao, setExibindoComprovanteImpressao] = useState(false);
  const [modalCancelarNotaAberto, setModalCancelarNotaAberto] = useState(false);
  const [justificativaCancelamento, setJustificativaCancelamento] = useState("");

  // ── Modal de Remetente (Criar / Editar) ──
  const [modalRemetenteAberto, setModalRemetenteAberto] = useState(false);
  const [remetenteEmEdicao, setRemetenteEmEdicao] = useState<RemetenteDTO | null>(null);
  const [formNomeRemetente, setFormNomeRemetente] = useState("");
  const [formDocRemetente, setFormDocRemetente] = useState("");
  const [formContatoRemetente, setFormContatoRemetente] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Proteção de rota exclusiva para NUTRICIONISTA
  useEffect(() => {
    if (!carregando) {
      if (!autenticado) {
        router.push("/");
      } else if (perfil === "ADMIN") {
        router.push("/usuarios");
      } else if (perfil === "COZINHA") {
        router.push("/consumo");
      }
    }
  }, [autenticado, carregando, perfil, router]);

  const carregarDados = useCallback(async () => {
    if (!autenticado || perfil !== "NUTRICIONISTA") return;
    setCarregandoDados(true);
    setErro(null);
    try {
      const ativoParam =
        filtroAtivoRemetente === "ATIVOS"
          ? true
          : filtroAtivoRemetente === "INATIVOS"
          ? false
          : undefined;

      const [listaNotas, listaRemetentes] = await Promise.all([
        listarNotas({
          status: filtroStatusNota,
          tipo: filtroTipoNota,
          remetenteId: filtroRemetenteId || undefined,
          dataInicio: filtroDataInicio || undefined,
          dataFim: filtroDataFim || undefined,
        }),
        listarRemetentes(ativoParam),
      ]);
      setNotas(listaNotas);
      setRemetentes(listaRemetentes);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados de notas e remetentes.");
    } finally {
      setCarregandoDados(false);
    }
  }, [
    autenticado,
    perfil,
    filtroStatusNota,
    filtroTipoNota,
    filtroRemetenteId,
    filtroDataInicio,
    filtroDataFim,
    filtroAtivoRemetente,
  ]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (carregando || !autenticado || perfil !== "NUTRICIONISTA") {
    return null;
  }

  const remetentesAtivos = remetentes.filter((r) => r.ativo);

  // ── Handlers de Nota (US27, US28, US29, US30, US33) ──

  const abrirModalNovaNota = async (modo: "EXTERNA" | "LOCAL") => {
    setErroModal(null);
    setModoModalNota(modo);
    setNotaEmEdicaoId(null);
    setFormNumeroNota("");
    setFormDataNota(new Date().toISOString().split("T")[0]);
    setFormRemetenteNotaId(remetentesAtivos[0]?.id || "");
    setFormResponsavelEntrega("");
    setFormObservacoesNota("");
    setFormMovimentacaoIds([]);
    setFormArquivoNota(null);
    setModalNotaAberto(true);

    try {
      const entradas = await listarEntradasDisponiveisNota();
      setEntradasDisponiveis(entradas);
    } catch (e: unknown) {
      setErroModal(e instanceof Error ? e.message : "Erro ao carregar entradas disponíveis.");
    }
  };

  const abrirModalEditarNota = async (nota: NotaResponseDTO) => {
    setErroModal(null);
    setModoModalNota("EDITAR");
    setNotaEmEdicaoId(nota.id);
    setFormNumeroNota(nota.numero);
    setFormDataNota(nota.data);
    setFormRemetenteNotaId(nota.remetente.id);
    setFormObservacoesNota(nota.observacoes || "");
    const idsAtuais = nota.entradas.map((e) => e.movimentacaoId);
    setFormMovimentacaoIds(idsAtuais);
    setFormArquivoNota(null);
    setModalNotaAberto(true);

    try {
      const livres = await listarEntradasDisponiveisNota();
      const combinadas = [
        ...nota.entradas,
        ...livres.filter((l) => !idsAtuais.includes(l.movimentacaoId)),
      ];
      setEntradasDisponiveis(combinadas);
    } catch {
      setEntradasDisponiveis(nota.entradas);
    }
  };

  const alternarSelecaoEntrada = (movId: string) => {
    setFormMovimentacaoIds((prev) =>
      prev.includes(movId) ? prev.filter((id) => id !== movId) : [...prev, movId]
    );
  };

  const handleSalvarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);

    if (!formRemetenteNotaId) {
      setErroModal("Selecione um remetente.");
      return;
    }
    if (formMovimentacaoIds.length === 0) {
      setErroModal("Selecione ao menos uma entrada de estoque para vincular à nota.");
      return;
    }

    setSalvando(true);
    try {
      let notaSalva: NotaResponseDTO;

      if (modoModalNota === "LOCAL") {
        if (!formResponsavelEntrega.trim()) {
          setErroModal("Informe o nome do responsável pela entrega.");
          setSalvando(false);
          return;
        }
        notaSalva = await emitirNotaLocal({
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          responsavelEntrega: formResponsavelEntrega.trim(),
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setSucesso(`Nota local ${notaSalva.numero} emitida com sucesso!`);
      } else if (modoModalNota === "EDITAR" && notaEmEdicaoId) {
        if (!formNumeroNota.trim()) {
          setErroModal("Informe o número da nota.");
          setSalvando(false);
          return;
        }
        notaSalva = await editarNotaPendente(notaEmEdicaoId, {
          numero: formNumeroNota.trim(),
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setNotaDetalhe(notaSalva);
        setSucesso(`Nota ${notaSalva.numero} atualizada com sucesso!`);
      } else {
        if (!formNumeroNota.trim()) {
          setErroModal("Informe o número da nota.");
          setSalvando(false);
          return;
        }
        notaSalva = await registrarNota({
          numero: formNumeroNota.trim(),
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setSucesso(`Nota ${notaSalva.numero} registrada com status Pendente!`);
      }

      if (formArquivoNota && notaSalva?.id) {
        await anexarDocumentoNota(notaSalva.id, formArquivoNota);
      }

      setModalNotaAberto(false);
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao salvar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirDetalheNota = async (id: string) => {
    setErro(null);
    setExibindoComprovanteImpressao(false);
    try {
      const detalhe = await buscarNotaPorId(id);
      setNotaDetalhe(detalhe);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar detalhes da nota.");
    }
  };

  const handleValidarNota = async (id: string) => {
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await validarNota(id);
      setNotaDetalhe(atualizada);
      setSucesso(`Nota ${atualizada.numero} validada com sucesso!`);
      await carregarDados();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao validar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarCancelamentoNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaDetalhe) return;
    if (!justificativaCancelamento.trim()) {
      setErroModal("A justificativa é obrigatória para cancelar a nota.");
      return;
    }

    setSalvando(true);
    setErroModal(null);
    try {
      const atualizada = await cancelarNota(
        notaDetalhe.id,
        justificativaCancelamento.trim()
      );
      setNotaDetalhe(atualizada);
      setModalCancelarNotaAberto(false);
      setJustificativaCancelamento("");
      setSucesso(`Nota ${atualizada.numero} cancelada.`);
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao cancelar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadDocumentoDetalhe = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !notaDetalhe) return;
    setErro(null);
    try {
      await anexarDocumentoNota(notaDetalhe.id, file);
      const atualizada = await buscarNotaPorId(notaDetalhe.id);
      setNotaDetalhe(atualizada);
      setSucesso("Documento anexado à nota com sucesso!");
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao anexar documento.");
    }
  };

  const handleBaixarDocumento = async (nota: NotaResponseDTO) => {
    setErro(null);
    try {
      const { blob, contentType } = await baixarDocumentoNota(nota.id);
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nota-${nota.numero}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao baixar documento.");
    }
  };

  // ── Handlers de Remetente (US26) ──

  const abrirModalNovoRemetente = () => {
    setErroModal(null);
    setRemetenteEmEdicao(null);
    setFormNomeRemetente("");
    setFormDocRemetente("");
    setFormContatoRemetente("");
    setModalRemetenteAberto(true);
  };

  const abrirModalEditarRemetente = (rem: RemetenteDTO) => {
    setErroModal(null);
    setRemetenteEmEdicao(rem);
    setFormNomeRemetente(rem.nome);
    setFormDocRemetente(rem.documento || "");
    setFormContatoRemetente(rem.contato || "");
    setModalRemetenteAberto(true);
  };

  const handleSalvarRemetente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);

    if (!formNomeRemetente.trim()) {
      setErroModal("O nome do remetente é obrigatório.");
      return;
    }
    if (!validarDocumentoCpfCnpj(formDocRemetente)) {
      setErroModal("O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: formNomeRemetente.trim(),
        documento: formDocRemetente.trim() || undefined,
        contato: formContatoRemetente.trim() || undefined,
      };

      if (remetenteEmEdicao) {
        await editarRemetente(remetenteEmEdicao.id, payload);
        setSucesso("Remetente atualizado com sucesso!");
      } else {
        await cadastrarRemetente(payload);
        setSucesso("Remetente cadastrado com sucesso!");
      }

      setModalRemetenteAberto(false);
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao salvar remetente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatusRemetente = async (rem: RemetenteDTO) => {
    setErro(null);
    try {
      if (rem.ativo) {
        await inativarRemetente(rem.id);
        setSucesso(`Remetente "${rem.nome}" inativado.`);
      } else {
        await reativarRemetente(rem.id);
        setSucesso(`Remetente "${rem.nome}" reativado.`);
      }
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao alterar status do remetente.");
    }
  };

  // KPIs de Notas
  const totalNotas = notas.length;
  const totalPendentes = notas.filter((n) => n.status === "PENDENTE").length;
  const totalValidadas = notas.filter((n) => n.status === "VALIDADA").length;
  const totalCanceladas = notas.filter((n) => n.status === "CANCELADA").length;

  const remetentesFiltrados = remetentes.filter(
    (r) =>
      r.nome.toLowerCase().includes(buscaRemetente.toLowerCase()) ||
      (r.documento || "").includes(buscaRemetente)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho e Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>Gestão de Notas & Remetentes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registre notas externas, emita notas locais sem valor fiscal, anexe comprovantes e valide os recebimentos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAbaAtiva("NOTAS")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              abaAtiva === "NOTAS"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Notas de Recebimento
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("REMETENTES")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              abaAtiva === "REMETENTES"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Remetentes ({remetentes.length})
          </button>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {erro && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
          <button type="button" onClick={() => setErro(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sucesso}</span>
          </div>
          <button type="button" onClick={() => setSucesso(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 1: NOTAS DE RECEBIMENTO                                           */}
      {/* ===================================================================== */}
      {abaAtiva === "NOTAS" && (
        <div className="space-y-6">
          {/* KPIs e Botões de Ação */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total de Notas</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalNotas}</p>
              </div>
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold uppercase text-amber-700">Pendentes</span>
                <p className="text-xl font-black text-amber-800 mt-0.5">{totalPendentes}</p>
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold uppercase text-emerald-700">Validadas</span>
                <p className="text-xl font-black text-emerald-800 mt-0.5">{totalValidadas}</p>
              </div>
              <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold uppercase text-rose-700">Canceladas</span>
                <p className="text-xl font-black text-rose-800 mt-0.5">{totalCanceladas}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => abrirModalNovaNota("EXTERNA")}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nota Externa</span>
              </button>
              <button
                type="button"
                onClick={() => abrirModalNovaNota("LOCAL")}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Emitir Nota Local</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros de Notas (US30 / #419) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Status
              </label>
              <select
                aria-label="Filtrar por status da nota"
                value={filtroStatusNota}
                onChange={(e) => setFiltroStatusNota(e.target.value as StatusNota | "")}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              >
                <option value="">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="VALIDADA">Validada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tipo de Nota
              </label>
              <select
                aria-label="Filtrar por tipo da nota"
                value={filtroTipoNota}
                onChange={(e) => setFiltroTipoNota(e.target.value as TipoNota | "")}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              >
                <option value="">Todos os Tipos</option>
                <option value="EXTERNA">Externa</option>
                <option value="LOCAL">Local (Interna)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Remetente
              </label>
              <select
                aria-label="Filtrar por remetente"
                value={filtroRemetenteId}
                onChange={(e) => setFiltroRemetenteId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              >
                <option value="">Todos os Remetentes</option>
                {remetentes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                aria-label="Data inicial"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Data Final
              </label>
              <input
                type="date"
                aria-label="Data final"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Tabela de Notas */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Remetente</th>
                  <th className="py-3 px-4">Entradas</th>
                  <th className="py-3 px-4">Anexo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {notas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {carregandoDados
                        ? "Carregando notas..."
                        : "Nenhuma nota encontrada para os filtros selecionados."}
                    </td>
                  </tr>
                ) : (
                  notas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{nota.numero}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            nota.tipo === "LOCAL"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {nota.tipo === "LOCAL" ? "Local" : "Externa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{nota.data}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{nota.remetenteNome}</div>
                        {nota.responsavelEntrega && (
                          <div className="text-[11px] text-slate-400">
                            Entregue por: {nota.responsavelEntrega}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {nota.quantidadeEntradas}
                      </td>
                      <td className="py-3 px-4">
                        {nota.possuiDocumento ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Sim</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            nota.status === "VALIDADA"
                              ? "bg-emerald-100 text-emerald-800"
                              : nota.status === "CANCELADA"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {nota.status === "VALIDADA" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : nota.status === "CANCELADA" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{nota.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalheNota(nota.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalhes</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: REMETENTES (US26 / #415)                                       */}
      {/* ===================================================================== */}
      {abaAtiva === "REMETENTES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <input
                type="text"
                placeholder="Buscar remetente por nome ou CPF/CNPJ..."
                value={buscaRemetente}
                onChange={(e) => setBuscaRemetente(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm flex-1"
              />
              <select
                aria-label="Filtrar status de remetentes"
                value={filtroAtivoRemetente}
                onChange={(e) => setFiltroAtivoRemetente(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              >
                <option value="TODOS">Todos os Remetentes</option>
                <option value="ATIVOS">Somente Ativos</option>
                <option value="INATIVOS">Somente Inativos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={abrirModalNovoRemetente}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Remetente</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">CPF / CNPJ</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {remetentesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhum remetente encontrado.
                    </td>
                  </tr>
                ) : (
                  remetentesFiltrados.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{rem.nome}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rem.documento || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{rem.contato || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rem.ativo
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rem.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarRemetente(rem)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlternarStatusRemetente(rem)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            rem.ativo
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {rem.ativo ? (
                            <>
                              <Power className="w-3.5 h-3.5" />
                              <span>Inativar</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reativar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE NOTA (US27 / US28 / US33)                */}
      {/* ===================================================================== */}
      {modalNotaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {modoModalNota === "LOCAL"
                  ? "Emitir Nota Local de Recebimento"
                  : modoModalNota === "EDITAR"
                  ? "Editar Nota Pendente"
                  : "Registrar Nota de Recebimento"}
              </h2>
              <button type="button" onClick={() => setModalNotaAberto(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {modoModalNota === "LOCAL" && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium">
                O número sequencial da nota local (ex.: <strong>NL-2026-0001</strong>) será gerado automaticamente pelo sistema. Documento interno sem valor fiscal.
              </div>
            )}

            {erroModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleSalvarNota} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modoModalNota !== "LOCAL" && (
                  <div>
                    <label
                      htmlFor="input-numero-nota"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Número da Nota *
                    </label>
                    <input
                      id="input-numero-nota"
                      type="text"
                      maxLength={50}
                      value={formNumeroNota}
                      onChange={(e) => setFormNumeroNota(e.target.value)}
                      placeholder="Ex: NF-000451"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="input-data-nota"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Data da Nota *
                  </label>
                  <input
                    id="input-data-nota"
                    type="date"
                    value={formDataNota}
                    onChange={(e) => setFormDataNota(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="select-remetente-nota"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Remetente *
                  </label>
                  <select
                    id="select-remetente-nota"
                    value={formRemetenteNotaId}
                    onChange={(e) => setFormRemetenteNotaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="">Selecione um remetente...</option>
                    {remetentesAtivos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {modoModalNota === "LOCAL" && (
                  <div>
                    <label
                      htmlFor="input-responsavel-entrega"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Responsável pela Entrega *
                    </label>
                    <input
                      id="input-responsavel-entrega"
                      type="text"
                      maxLength={150}
                      value={formResponsavelEntrega}
                      onChange={(e) => setFormResponsavelEntrega(e.target.value)}
                      placeholder="Ex: João Silva (Agroindústria)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Seletor de Entradas Disponíveis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entradas de Estoque Vinculadas * ({formMovimentacaoIds.length} selecionada(s))
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {entradasDisponiveis.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhuma entrada de estoque disponível sem nota vinculada.
                    </div>
                  ) : (
                    entradasDisponiveis.map((ent) => (
                      <label
                        key={ent.movimentacaoId}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={formMovimentacaoIds.includes(ent.movimentacaoId)}
                            onChange={() => alternarSelecaoEntrada(ent.movimentacaoId)}
                          />
                          <div>
                            <span className="font-bold text-slate-800">{ent.produtoNome}</span>
                            <span className="text-slate-500 ml-2">
                              ({ent.quantidade} {ent.unidadeMedida} • {ent.localNome})
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-400">{ent.data}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-obs-nota"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Observações (Opcional)
                </label>
                <textarea
                  id="input-obs-nota"
                  rows={2}
                  maxLength={500}
                  value={formObservacoesNota}
                  onChange={(e) => setFormObservacoesNota(e.target.value)}
                  placeholder="Observações adicionais sobre o recebimento..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              {modoModalNota !== "EDITAR" && (
                <div>
                  <label
                    htmlFor="input-arquivo-nota"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Anexar Documento Digitalizado — PDF, JPEG ou PNG até 5 MB (Opcional)
                  </label>
                  <input
                    id="input-arquivo-nota"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => setFormArquivoNota(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNotaAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  {salvando ? "Salvando..." : "Salvar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE DETALHE DA NOTA (US28 / US29 / US30 / US33)                  */}
      {/* ===================================================================== */}
      {notaDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Nota {notaDetalhe.numero} ({notaDetalhe.tipo === "LOCAL" ? "Local" : "Externa"})
                </h2>
                <p className="text-xs text-slate-500">
                  Remetente: <strong>{notaDetalhe.remetente.nome}</strong> • Data: {notaDetalhe.data}
                </p>
              </div>
              <button type="button" onClick={() => setNotaDetalhe(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Metadados e Auditoria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">Status</span>
                <span className="font-black text-slate-900">{notaDetalhe.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">Registrado por</span>
                <span className="font-semibold text-slate-800">
                  {notaDetalhe.registradoPor?.nome}
                </span>
              </div>
              {notaDetalhe.responsavelEntrega && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block">
                    Responsável pela Entrega
                  </span>
                  <span className="font-semibold text-slate-800">
                    {notaDetalhe.responsavelEntrega}
                  </span>
                </div>
              )}
              {notaDetalhe.decididoPor && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block">
                    {notaDetalhe.status === "VALIDADA" ? "Validada por" : "Cancelada por"}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {notaDetalhe.decididoPor.nome}
                  </span>
                </div>
              )}
            </div>

            {notaDetalhe.justificativaCancelamento && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <strong>Motivo do Cancelamento:</strong> {notaDetalhe.justificativaCancelamento}
              </div>
            )}

            {/* Entradas Vinculadas */}
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">
                Entradas de Estoque Vinculadas ({notaDetalhe.entradas.length})
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2 px-3">Produto</th>
                      <th className="py-2 px-3">Quantidade</th>
                      <th className="py-2 px-3">Local</th>
                      <th className="py-2 px-3">Lote / Validade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notaDetalhe.entradas.map((ent) => (
                      <tr key={ent.movimentacaoId}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {ent.produtoNome}
                        </td>
                        <td className="py-2 px-3">
                          {ent.quantidade} {ent.unidadeMedida}
                        </td>
                        <td className="py-2 px-3">{ent.localNome}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {ent.lote || "—"} {ent.dataValidade ? `• Val: ${ent.dataValidade}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comprovante para Impressão e Assinatura (US33 / #420) */}
            {notaDetalhe.tipo === "LOCAL" && exibindoComprovanteImpressao && (
              <div
                data-testid="comprovante-nota-local"
                className="p-5 rounded-xl border-2 border-dashed border-slate-300 bg-white space-y-4 text-xs"
              >
                <div className="text-center border-b border-slate-200 pb-3">
                  <p className="font-black text-sm text-slate-900">
                    IFPE CAMPUS BELO JARDIM — COZINHA / REFEITÓRIO
                  </p>
                  <p className="font-bold text-slate-700">
                    COMPROVANTE INTERNO DE RECEBIMENTO — SEM VALOR FISCAL
                  </p>
                  <p className="text-slate-500 mt-1">
                    Nota Local Nº <strong>{notaDetalhe.numero}</strong> • Data: {notaDetalhe.data}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <strong>Origem / Remetente:</strong> {notaDetalhe.remetente.nome}
                  </p>
                  <p>
                    <strong>Entregue por:</strong> {notaDetalhe.responsavelEntrega}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 text-center">
                  <div className="border-t border-slate-400 pt-1">
                    Assinatura do Responsável pela Entrega ({notaDetalhe.responsavelEntrega})
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    Assinatura da Nutricionista Responsável ({notaDetalhe.registradoPor?.nome})
                  </div>
                </div>
              </div>
            )}

            {/* Anexo e Ações de Conferência */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {notaDetalhe.possuiDocumento && (
                  <button
                    type="button"
                    onClick={() => handleBaixarDocumento(notaDetalhe)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Documento</span>
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Anexar PDF/Foto</span>
                  <input
                    type="file"
                    aria-label="Upload de documento no detalhe"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleUploadDocumentoDetalhe}
                    className="hidden"
                  />
                </label>

                {notaDetalhe.tipo === "LOCAL" && (
                  <button
                    type="button"
                    onClick={() => {
                      setExibindoComprovanteImpressao(true);
                      if (typeof window !== "undefined" && window.print) {
                        window.print();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir para Assinatura</span>
                  </button>
                )}
              </div>

              {notaDetalhe.status === "PENDENTE" && (
                <div className="flex flex-wrap items-center gap-2">
                  {notaDetalhe.tipo === "EXTERNA" && (
                    <button
                      type="button"
                      onClick={() => abrirModalEditarNota(notaDetalhe)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Nota</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setErroModal(null);
                      setJustificativaCancelamento("");
                      setModalCancelarNotaAberto(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar Nota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidarNota(notaDetalhe.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validar Nota</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CANCELAMENTO DE NOTA COM JUSTIFICATIVA (US29 / #418)         */}
      {/* ===================================================================== */}
      {modalCancelarNotaAberto && notaDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-slate-900">
              Cancelar Nota {notaDetalhe.numero}
            </h3>
            <p className="text-xs text-slate-600">
              Informe a justificativa do cancelamento. As entradas de estoque vinculadas{" "}
              <strong>não são estornadas</strong> (o saldo de estoque permanece inalterado).
            </p>

            {erroModal && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleConfirmarCancelamentoNota} className="space-y-4">
              <div>
                <label
                  htmlFor="input-justificativa-cancelamento"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Justificativa do Cancelamento *
                </label>
                <textarea
                  id="input-justificativa-cancelamento"
                  rows={3}
                  maxLength={500}
                  value={justificativaCancelamento}
                  onChange={(e) => setJustificativaCancelamento(e.target.value)}
                  placeholder="Descreva o motivo da recusa ou cancelamento..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCancelarNotaAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE REMETENTE (US26 / #415)                 */}
      {/* ===================================================================== */}
      {modalRemetenteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {remetenteEmEdicao ? "Editar Remetente" : "Cadastrar Remetente"}
              </h2>
              <button type="button" onClick={() => setModalRemetenteAberto(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleSalvarRemetente} className="space-y-4">
              <div>
                <label
                  htmlFor="input-nome-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nome do Remetente *
                </label>
                <input
                  id="input-nome-remetente"
                  type="text"
                  maxLength={150}
                  value={formNomeRemetente}
                  onChange={(e) => setFormNomeRemetente(e.target.value)}
                  placeholder="Ex: Setor de Agroindústria IFPE"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="input-doc-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  CPF ou CNPJ (Opcional)
                </label>
                <input
                  id="input-doc-remetente"
                  type="text"
                  maxLength={20}
                  value={formDocRemetente}
                  onChange={(e) => setFormDocRemetente(e.target.value)}
                  placeholder="11 dígitos (CPF) ou 14 dígitos (CNPJ)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="input-contato-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Contato (Opcional)
                </label>
                <input
                  id="input-contato-remetente"
                  type="text"
                  maxLength={150}
                  value={formContatoRemetente}
                  onChange={(e) => setFormContatoRemetente(e.target.value)}
                  placeholder="Telefone ou e-mail"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalRemetenteAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  {salvando ? "Salvando..." : "Salvar Remetente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
