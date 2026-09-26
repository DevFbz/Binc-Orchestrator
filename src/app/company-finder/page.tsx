"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Check, Copy, ExternalLink, Globe2, LoaderCircle, MapPin, Phone, Search, ShieldCheck, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Company = {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  maps_url: string;
  business_status: string;
  primary_type: string;
  source: string;
};

type SearchResult = {
  query: string;
  companies: Company[];
  companies_count: number;
  pages_scanned: number;
  has_more: boolean;
  source: string;
  notice: string;
};

type ApiError = { error?: string; message?: string; code?: string };

const STATES = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"],
  ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

const statusLabel: Record<string, string> = { OPERATIONAL: "Ativa", CLOSED_TEMPORARILY: "Fechada temporariamente", CLOSED_PERMANENTLY: "Encerrada" };

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `https://wa.me/${digits}`;
  return "";
}

function outreachMessage(company: Company, offer: string) {
  const service = offer.trim() || "soluções digitais para melhorar o atendimento e a operação";
  return `Olá, ${company.name}! Encontrei a empresa de vocês e trabalho com ${service}. Posso te mostrar uma ideia rápida e sem compromisso para ajudar a operação?`;
}

export default function CompanyFinderPage() {
  const [niche, setNiche] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [offer, setOffer] = useState("sites, automações e atendimento digital");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setCopied("");
    if (!niche.trim() || !state || !city.trim()) {
      setError("Informe o nicho, o estado e a cidade para iniciar a varredura.");
      return;
    }
    setWorking(true);
    try {
      const response = await fetch("/api/company-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, state, city, page_size: 20, max_pages: 3, provider: "openstreetmap" }),
      });
      const payload = await response.json() as SearchResult & ApiError;
      if (!response.ok) throw new Error(payload.message || payload.error || (payload.code === "company_finder_not_configured" ? "Google Places ainda não foi configurado no control plane." : "Não foi possível concluir a busca."));
      setResult(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a busca.");
    } finally {
      setWorking(false);
    }
  }

  async function copyMessage(company: Company) {
    try {
      await navigator.clipboard.writeText(outreachMessage(company, offer));
      setCopied(company.place_id);
      window.setTimeout(() => setCopied((current) => current === company.place_id ? "" : current), 2200);
    } catch {
      setError("O navegador bloqueou a cópia automática. Selecione a mensagem manualmente.");
    }
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link>
      <span className={styles.secure}><ShieldCheck size={14} /> Dados públicos · revisão humana</span>
    </header>

    <section className={styles.hero}>
      <div>
        <p className={styles.kicker}>PROSPECÇÃO LOCAL</p>
        <h1>Encontre empresas<span>.</span></h1>
        <p className={styles.subtitle}>Monte uma lista qualificada por nicho e localização, veja os canais públicos disponíveis e prepare o primeiro contato sem disparos automáticos.</p>
      </div>
      <div className={styles.heroMark}><Building2 size={25} /><span>LEAD<br />FINDER</span></div>
    </section>

    <section className={styles.searchPanel} aria-labelledby="finder-title">
      <div className={styles.panelIntro}><div><p className={styles.kicker}>NOVA VARREDURA</p><h2 id="finder-title">Defina o território</h2></div><span className={styles.limit}>até 20 resultados · modo gratuito</span></div>
      <form className={styles.form} onSubmit={search}>
        <label className={styles.fieldWide}><span>Nicho da empresa</span><input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="Ex.: clínicas odontológicas" maxLength={120} /></label>
        <label><span>Estado</span><select value={state} onChange={(event) => setState(event.target.value)}><option value="">Selecione</option>{STATES.map(([code, label]) => <option value={code} key={code}>{label} ({code})</option>)}</select></label>
        <label><span>Cidade</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Campinas" maxLength={100} /></label>
        <label className={styles.fieldWide}><span>Oferta para a abordagem</span><input value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Ex.: site e automação de WhatsApp" maxLength={160} /></label>
        <button className={styles.primary} type="submit" disabled={working}>{working ? <LoaderCircle className={styles.spin} size={16} /> : <Search size={16} />}{working ? "Varredura em andamento…" : "Buscar empresas"}</button>
      </form>
      <p className={styles.formHint}>Modo gratuito via OpenStreetMap/Nominatim. A cobertura de empresas e contatos depende do cadastro público; confirme os dados antes de abordar.</p>
    </section>

    {error && <div className={styles.notice} role="alert"><XCircle size={18} /><div><strong>Busca não concluída</strong><p>{error}</p></div></div>}

    {result && <section className={styles.results} aria-live="polite">
      <div className={styles.resultsHead}><div><p className={styles.kicker}>RESULTADO DA VARREDURA</p><h2>{result.companies_count} empresas encontradas</h2><p className={styles.query}>{result.query}</p></div><div className={styles.resultMeta}><strong>{result.pages_scanned} páginas</strong><span>{result.has_more ? "Há mais resultados" : "Busca finalizada"}</span></div></div>
      <div className={styles.noticeSoft}><ShieldCheck size={16} /><p>{result.notice}</p></div>
      {result.companies.length ? <div className={styles.companyList}>{result.companies.map((company) => { const whatsapp = whatsappUrl(company.phone); const message = outreachMessage(company, offer); return <article className={styles.company} key={company.place_id}>
        <div className={styles.companyTop}><div className={styles.companyIdentity}><span className={styles.companyIcon}><Building2 size={18} /></span><div><h3>{company.name}</h3><p>{statusLabel[company.business_status] || "Status não informado"}{company.primary_type ? ` · ${company.primary_type.replaceAll("_", " ")}` : ""}</p></div></div><button className={styles.copy} type="button" onClick={() => copyMessage(company)}>{copied === company.place_id ? <Check size={14} /> : <Copy size={14} />}{copied === company.place_id ? "Copiada" : "Copiar mensagem"}</button></div>
        <div className={styles.companyDetails}><span><MapPin size={14} />{company.address || "Endereço não informado"}</span>{company.phone && <span><Phone size={14} />{company.phone}</span>}</div>
        <p className={styles.message}><strong>Mensagem sugerida:</strong> {message}</p>
        <div className={styles.companyActions}>{company.phone && whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer"><Phone size={14} /> WhatsApp</a>}{company.website && <a href={company.website} target="_blank" rel="noreferrer"><Globe2 size={14} /> Site</a>}{company.maps_url && <a href={company.maps_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Maps</a>}</div>
      </article>; })}</div> : <div className={styles.empty}>A fonte não retornou empresas para esse recorte. Tente ampliar o nicho ou revisar a grafia da cidade.</div>}
      <p className={styles.attribution}>Fonte: {result.source}. CNPJ não é fornecido por esta consulta; não foi inferido.</p>
    </section>}

    {!result && !error && <section className={styles.emptyState}><div className={styles.emptyIcon}><MapPin size={22} /></div><div><h2>Comece por um recorte local</h2><p>Escolha um nicho, um estado e uma cidade. O Binc consulta páginas do provedor, remove duplicados e deixa os canais públicos prontos para sua revisão.</p></div></section>}
    <MobileNav />
  </main>;
}
