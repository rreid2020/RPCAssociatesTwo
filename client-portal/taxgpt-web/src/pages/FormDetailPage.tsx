import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const FORMS_MODULE_ENABLED = import.meta.env.VITE_FORMS_MODULE_ENABLED !== 'false';

type FormRecord = {
  id: string;
  formCode: string;
  formName: string;
  jurisdiction: 'federal' | 'provincial';
  category: string;
  summary: string;
  whoMustFile: string;
  whenRequired: string;
  documentsThatFeedInto: string[];
  commonMistakes?: string | null;
  affects: Record<string, unknown>;
  relatedFormCodes: string[];
  taxYearsSupported: number[];
  riskLevel: 'low' | 'medium' | 'high';
  lastReviewedAt?: string | null;
};

type SourceRef = {
  id: string;
  sourceType: 'internal_doc' | 'external_url';
  title: string;
  snippet?: string | null;
  authority: 'cra' | 'canlii' | 'other';
  lastVerifiedAt?: string | null;
  url?: string | null;
};

type AskResponse = {
  answer: string;
  citations: Array<{ title: string; url: string }>;
  riskLevel: 'low' | 'medium' | 'high';
};

export default function FormDetailPage() {
  const { formCode } = useParams();
  const { user } = useUser();
  const [form, setForm] = useState<FormRecord | null>(null);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Array<{ title: string; url: string }>>([]);
  const [asking, setAsking] = useState(false);

  const hasPremiumAccess = useMemo(() => {
    const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
    const raw = metadata?.services || metadata?.paidServices;
    if (Array.isArray(raw)) {
      return raw.map((value) => String(value).toLowerCase()).includes('taxgpt-forms');
    }
    return false;
  }, [user]);

  useEffect(() => {
    if (!FORMS_MODULE_ENABLED || !formCode) {
      return;
    }

    const controller = new AbortController();
    const fetchForm = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/forms/${encodeURIComponent(formCode)}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Form not found');
        }
        const data = await response.json();
        setForm(data.form);
        setSources(data.sources || []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to load form details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
    return () => controller.abort();
  }, [formCode]);

  const handleAsk = async () => {
    if (!formCode || !question.trim()) return;
    setAsking(true);
    setAnswer(null);
    setCitations([]);
    try {
      const response = await fetch(`${API_URL}/api/forms/${encodeURIComponent(formCode)}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question }),
      });
      if (!response.ok) {
        throw new Error('Unable to answer');
      }
      const data = (await response.json()) as AskResponse;
      setAnswer(data.answer);
      setCitations(data.citations || []);
    } catch (err) {
      setAnswer('Sorry, I could not answer that question right now.');
    } finally {
      setAsking(false);
    }
  };

  if (!FORMS_MODULE_ENABLED) {
    return (
      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#333333]">Tax Form Guidance</h1>
        <p className="mt-2 text-sm text-[#666666]">
          The forms module is currently disabled. Set VITE_FORMS_MODULE_ENABLED=true to enable.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-[#666666]">Loading form…</div>;
  }

  if (error || !form) {
    return (
      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">{error || 'Form not found.'}</p>
        <Link to="/forms" className="mt-4 inline-flex text-sm text-[#183956]">
          Back to forms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <Link to="/forms" className="text-xs font-semibold uppercase text-[#183956]">
          ← Back to forms
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#666666]">
              {form.formCode} · {form.category}
            </p>
            <h1 className="text-2xl font-semibold text-[#333333]">{form.formName}</h1>
            <p className="mt-2 text-sm text-[#666666]">
              Jurisdiction: {form.jurisdiction.toUpperCase()}
            </p>
          </div>
          <span
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              form.riskLevel === 'high'
                ? 'bg-red-100 text-red-700'
                : form.riskLevel === 'medium'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[#f9f7f6] text-[#183956]'
            }`}
          >
            {form.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="What is this form?">{form.summary}</Section>
          <Section title="Who needs to file it?">{form.whoMustFile}</Section>
          <Section title="When is it required?">{form.whenRequired}</Section>
          <Section title="Documents that feed into this form">
            {form.documentsThatFeedInto.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-[#666666]">
                {form.documentsThatFeedInto.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#666666]">Not specified.</p>
            )}
          </Section>
          <Section title="What does it affect?">
            <pre className="whitespace-pre-wrap text-sm text-[#666666]">
              {JSON.stringify(form.affects, null, 2)}
            </pre>
          </Section>

          <Section title="Common mistakes">
            {hasPremiumAccess ? (
              <p className="text-sm text-[#666666]">{form.commonMistakes || 'Not specified.'}</p>
            ) : (
              <p className="text-sm text-[#666666]">
                This section is available with premium access.
              </p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-[#e0e0e0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#333333]">CRA references</h2>
            <div className="mt-3 space-y-3">
              {sources.length === 0 ? (
                <p className="text-sm text-[#666666]">No references available.</p>
              ) : (
                sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md border border-[#e0e0e0] bg-[#f9f7f6] p-3 text-sm text-[#333333] hover:bg-[#f3eee9]"
                  >
                    <p className="font-medium">{source.title}</p>
                    {source.snippet && <p className="mt-1 text-xs text-[#666666]">{source.snippet}</p>}
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-[#e0e0e0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#333333]">Ask about this form</h2>
            {hasPremiumAccess ? (
              <>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  placeholder="Ask a question about this form (educational only)"
                  className="mt-3 w-full rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e0e0e0]"
                />
                <button
                  onClick={handleAsk}
                  disabled={asking || question.trim().length < 3}
                  className="mt-3 inline-flex items-center rounded-md bg-[#183956] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f4d73] disabled:opacity-50"
                >
                  {asking ? 'Answering…' : 'Ask'}
                </button>
                {answer && (
                  <div className="mt-4 rounded-md border border-[#e0e0e0] bg-[#f9f7f6] p-3 text-sm text-[#333333] whitespace-pre-line">
                    {answer}
                  </div>
                )}
                {citations.length > 0 && (
                  <div className="mt-3 text-xs text-[#666666]">
                    <p className="font-semibold text-[#333333]">Citations</p>
                    <ul className="mt-2 space-y-1">
                      {citations.map((citation, index) => (
                        <li key={`${citation.url}-${index}`}>
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#183956] hover:underline"
                          >
                            [{index + 1}] {citation.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-[#666666]">
                Premium access is required to ask questions about this form.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[#e0e0e0] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[#333333]">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
