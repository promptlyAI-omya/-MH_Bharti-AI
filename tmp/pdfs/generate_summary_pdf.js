const fs = require("fs");
const path = require("path");

const outputPath = path.resolve(
  __dirname,
  "..",
  "..",
  "output",
  "pdf",
  "mh_bharti_ai_summary.pdf"
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 34;
const contentWidth = pageWidth - margin * 2;

const colors = {
  ink: "0.086 0.129 0.196",
  muted: "0.357 0.392 0.447",
  accent: "0.937 0.420 0.122",
  border: "0.835 0.863 0.898",
  panelFill: "0.969 0.976 0.988",
  badgeFill: "1.000 0.949 0.914",
  badgeBorder: "1.000 0.851 0.773",
  white: "1 1 1",
};

function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function estimateTextWidth(text, fontSize) {
  let units = 0;
  for (const ch of text) {
    if ("il.,:;'| ".includes(ch)) units += 0.28;
    else if ("fjrt()[]".includes(ch)) units += 0.36;
    else if ("mwMW@#%&".includes(ch)) units += 0.9;
    else if ("ABCDEFGHKNOPQRSTUVXYZ".includes(ch)) units += 0.68;
    else units += 0.56;
  }
  return units * fontSize;
}

function wrapText(text, maxWidth, fontSize) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

let stream = "";

function add(cmd) {
  stream += `${cmd}\n`;
}

function setFillColor(color) {
  add(`${color} rg`);
}

function setStrokeColor(color) {
  add(`${color} RG`);
}

function setLineWidth(width) {
  add(`${width} w`);
}

function rect(x, y, w, h, fill = false, stroke = true) {
  add(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
  if (fill && stroke) add("B");
  else if (fill) add("f");
  else if (stroke) add("S");
}

function drawLine(x1, y1, x2, y2) {
  add(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
}

function text(x, y, value, opts = {}) {
  const font = opts.font === "bold" ? "F2" : "F1";
  const size = opts.size || 10;
  const color = opts.color || colors.ink;
  setFillColor(color);
  add("BT");
  add(`/${font} ${size} Tf`);
  add(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
  add(`(${escapePdfText(value)}) Tj`);
  add("ET");
}

function paragraph(x, topY, value, width, opts = {}) {
  const size = opts.size || 10;
  const lineGap = opts.lineGap || 2.8;
  const lines = wrapText(value, width, size);
  let y = topY;
  for (const line of lines) {
    text(x, y, line, opts);
    y -= size + lineGap;
  }
  return y;
}

function bulletList(x, topY, items, width, opts = {}) {
  const size = opts.size || 10;
  const lineGap = opts.lineGap || 2.5;
  let y = topY;
  const bulletWidth = 12;
  for (const item of items) {
    const lines = wrapText(item, width - bulletWidth, size);
    text(x, y, "- ", opts);
    let lineY = y;
    for (const line of lines) {
      text(x + bulletWidth, lineY, line, opts);
      lineY -= size + lineGap;
    }
    y = lineY - 1.5;
  }
  return y;
}

function sectionTitle(x, y, label) {
  text(x, y, label.toUpperCase(), { font: "bold", size: 11, color: colors.accent });
}

let cursorY = pageHeight - margin;

text(margin, cursorY - 12, "MH_Bharti AI", { font: "bold", size: 24 });
text(margin, cursorY - 29, "One-page repo summary based only on files in this workspace.", {
  size: 10.5,
  color: colors.muted,
});

setFillColor(colors.badgeFill);
setStrokeColor(colors.badgeBorder);
setLineWidth(1);
rect(pageWidth - margin - 94, cursorY - 28, 94, 20, true, true);
text(pageWidth - margin - 82, cursorY - 15, "REPO EVIDENCE", {
  font: "bold",
  size: 9.5,
  color: colors.accent,
});

setStrokeColor(colors.border);
drawLine(margin, cursorY - 40, pageWidth - margin, cursorY - 40);
cursorY -= 54;

function sectionBox(title, bodyFn, height) {
  setFillColor(colors.panelFill);
  setStrokeColor(colors.border);
  setLineWidth(1);
  rect(margin, cursorY - height, contentWidth, height, true, true);
  sectionTitle(margin + 12, cursorY - 18, title);
  bodyFn(margin + 12, cursorY - 34);
  cursorY -= height + 10;
}

sectionBox(
  "What It Is",
  (x, y) => {
    paragraph(
      x,
      y,
      "MH_Bharti AI is a Next.js exam-prep web app for Maharashtra government exam aspirants. Repo evidence shows Marathi-first practice flows, mock tests, progress tracking, AI tutoring, Supabase-backed auth/data, and premium payment hooks.",
      contentWidth - 24,
      { size: 10.2 }
    );
  },
  72
);

sectionBox(
  "Who It Is For",
  (x, y) => {
    paragraph(
      x,
      y,
      "Primary persona: Marathi-speaking learners preparing for Police Bharti, MPSC, Talathi, and Gramsevak exams.",
      contentWidth - 24,
      { size: 10.2 }
    );
  },
  58
);

sectionBox(
  "What It Does",
  (x, y) => {
    bulletList(
      x,
      y,
      [
        "Shows exam and topic practice paths for four exam categories.",
        "Fetches question sets by exam, topic, and difficulty through /api/questions.",
        "Offers a mock-test catalog with free and premium-gated entries.",
        "Stores results and computes progress stats, topic breakdowns, and streak-linked activity.",
        "Provides Marathi AI chat powered by Groq with response caching and per-user credit limits.",
        "Supports Supabase login via Google OAuth, email/password, and magic link.",
        "Handles premium upgrade flow with Razorpay order creation and payment verification."
      ],
      contentWidth - 24,
      { size: 9.7 }
    );
  },
  182
);

sectionBox(
  "How It Works",
  (x, y) => {
    const lines = [
      "Frontend: Next.js 14 App Router pages under src/app for home, practice, mock tests, AI chat, progress, profile, login, and settings.",
      "Client state: SupabaseProvider listens for auth changes, loads the current user row from users, and exposes profile, credits, and plan to pages.",
      "APIs: Route handlers under src/app/api serve questions, store results, proxy AI chat, and manage Razorpay payment flows.",
      "Data: Supabase schema defines users, questions, results, ai_cache, and subscriptions with RLS policies.",
      "AI path: /api/ai-chat hashes prompts, checks ai_cache, chooses a Groq model, stores cache, and decrements credits.",
      "Data flow: Browser UI -> Next.js route handlers -> Supabase tables; AI chat also calls Groq, and premium checkout also calls Razorpay before updating Supabase."
    ];
    bulletList(x, y, lines, contentWidth - 24, { size: 9.4 });
  },
  176
);

sectionBox(
  "How To Run",
  (x, y) => {
    bulletList(
      x,
      y,
      [
        "Install dependencies with npm install.",
        "Create .env.local from .env.example and set Supabase, Razorpay, Groq, and NEXT_PUBLIC_APP_URL values.",
        "Start the app with npm run dev.",
        "Open http://localhost:3000.",
        "Not found in repo: a documented command to apply supabase/schema.sql or seed question data for first-time setup."
      ],
      contentWidth - 24,
      { size: 9.7 }
    );
  },
  118
);

setStrokeColor(colors.border);
drawLine(margin, 42, pageWidth - margin, 42);
text(
  margin,
  26,
  "Evidence used: package.json, .env.example, src/app/*, src/app/api/*, src/components/SupabaseProvider.tsx, src/lib/supabase.ts, and supabase/schema.sql.",
  { size: 8.7, color: colors.muted }
);

const objects = [];

function addObject(content) {
  objects.push(content);
  return objects.length;
}

const font1 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const font2 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const contentObject = addObject(
  `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream`
);
const pageObject = addObject(
  `<< /Type /Page /Parent 5 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObject} 0 R /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> >>`
);
const pagesObject = addObject(`<< /Type /Pages /Count 1 /Kids [${pageObject} 0 R] >>`);
const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

let pdf = "%PDF-1.4\n";
const offsets = [0];

for (let i = 0; i < objects.length; i += 1) {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefStart = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i < offsets.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

fs.writeFileSync(outputPath, pdf, "binary");
console.log(outputPath);
