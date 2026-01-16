import fs from 'fs'
import path from 'path'

/**
 * WordPress WXR → Resources MDX importer
 *
 * Usage:
 *   node scripts/import-wp-resources.mjs "/absolute/path/to/export.xml"
 *
 * Output:
 *   content/resources/<slug>.mdx
 */

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Missing XML path. Example:')
  console.error('  node scripts/import-wp-resources.mjs "/Users/me/Downloads/site.WordPress.xml"')
  process.exit(1)
}

const outDir = path.join(process.cwd(), 'content', 'resources')
fs.mkdirSync(outDir, { recursive: true })

// --- tiny helpers ---
const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function stripWpComments(html) {
  return String(html || '')
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '')
    .trim()
}

function htmlToMarkdown(html) {
  // Minimal conversion tuned for Gutenberg exports.
  // (We keep it dependency-free on purpose.)
  let s = stripWpComments(html)

  // headings
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${textOnly(t)}\n\n`)
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${textOnly(t)}\n\n`)
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n\n#### ${textOnly(t)}\n\n`)

  // links
  s = s.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
    const txt = textOnly(label)
    return `[${txt}](${href})`
  })

  // bold/strong
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${textOnly(t)}**`)

  // paragraphs → blank-line separated
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `\n\n${textOnlyPreserveLinks(t)}\n\n`)

  // lists
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${textOnlyPreserveLinks(t)}`)
  s = s.replace(/<ul[^>]*>/gi, '\n')
  s = s.replace(/<\/ul>/gi, '\n\n')
  s = s.replace(/<ol[^>]*>/gi, '\n')
  s = s.replace(/<\/ol>/gi, '\n\n')

  // line breaks
  s = s.replace(/<br\s*\/?>/gi, '\n')

  // strip remaining tags
  s = s.replace(/<\/?[^>]+>/g, '')

  // cleanup
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

function textOnly(html) {
  return String(html || '')
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, __, label) => textOnly(label))
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function textOnlyPreserveLinks(html) {
  // Preserve markdown links we already converted above (if any).
  return String(html || '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractBetween(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1] : ''
}

function extractCdata(xml, tag) {
  const raw = extractBetween(xml, tag)
  const m = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i)
  return (m ? m[1] : raw).trim()
}

function splitItems(xml) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml))) {
    items.push(m[1])
  }
  return items
}

function findAllCategories(itemXml) {
  const out = []
  const re = /<category[^>]*domain=["']([^"']+)["'][^>]*>([\s\S]*?)<\/category>/gi
  let m
  while ((m = re.exec(itemXml))) {
    const domain = m[1]
    const label = textOnly(m[2].replace(/<!\[CDATA\[|\]\]>/g, ''))
    out.push({ domain, label })
  }
  return out
}

function inferTopicKey(title) {
  const t = title.toLowerCase()
  if (t.includes('new jersey') || t.includes('nj')) return 'nj-laws'
  if (t.includes('edible')) return 'edibles'
  if (t.includes('vape')) return 'vapes'
  if (t.includes('pre-roll') || t.includes('preroll')) return 'pre-rolls'
  if (t.includes('thc') || t.includes('cbd')) return 'cannabinoids'
  if (t.includes('terpene')) return 'terpenes'
  if (t.includes('strain')) return 'strains'
  return 'general'
}

const SOURCE_BANK = {
  general: [
    { a: 'National Institute on Drug Abuse (cannabis)', u: 'https://nida.nih.gov/research-topics/marijuana' },
    { a: 'CDC (cannabis and health)', u: 'https://www.cdc.gov/cannabis/index.html' },
    { a: 'NIH (PubMed)', u: 'https://pubmed.ncbi.nlm.nih.gov/' },
    { a: 'PubMed Central (free full text)', u: 'https://pmc.ncbi.nlm.nih.gov/' },
    { a: 'ScienceDaily (cannabis news)', u: 'https://www.sciencedaily.com/news/mind_brain/cannabis/' },
    { a: 'Mayo Clinic (edibles overview)', u: 'https://www.mayoclinic.org/' },
    { a: 'Cleveland Clinic (marijuana)', u: 'https://my.clevelandclinic.org/health/drugs/21562-marijuana-cannabis' },
    { a: 'NORML (policy overview)', u: 'https://norml.org/' },
    { a: 'Project CBD (cannabinoids)', u: 'https://projectcbd.org/' },
    { a: 'Leafly (science section)', u: 'https://www.leafly.com/news/science-tech' },
  ],
  'nj-laws': [
    { a: 'New Jersey Cannabis Regulatory Commission', u: 'https://www.nj.gov/cannabis/' },
    { a: 'NJCRC consumer guidance', u: 'https://www.nj.gov/cannabis/adult-personal/' },
    { a: 'NORML (New Jersey laws)', u: 'https://norml.org/laws/new-jersey-penalties-2/' },
    { a: 'CDC (impaired driving)', u: 'https://www.cdc.gov/transportationsafety/impaired_driving/index.html' },
    { a: 'NHTSA (drug-impaired driving)', u: 'https://www.nhtsa.gov/risky-driving/drug-impaired-driving' },
  ],
  edibles: [
    { a: 'CDC (edibles safety)', u: 'https://www.cdc.gov/cannabis/health-effects/edibles.html' },
    { a: 'NIDA (edibles and onset)', u: 'https://nida.nih.gov/publications/research-reports/marijuana/what-are-marijuanas-effects' },
    { a: 'PubMed (THC pharmacokinetics)', u: 'https://pubmed.ncbi.nlm.nih.gov/?term=THC+pharmacokinetics+oral' },
  ],
  vapes: [
    { a: 'CDC (vaping & lung injury)', u: 'https://www.cdc.gov/tobacco/basic_information/e-cigarettes/severe-lung-disease.html' },
    { a: 'FDA (vaping updates)', u: 'https://www.fda.gov/tobacco-products' },
    { a: 'PubMed (cannabis vaping research)', u: 'https://pubmed.ncbi.nlm.nih.gov/?term=cannabis+vaping' },
  ],
  cannabinoids: [
    { a: 'NIDA (THC and CBD basics)', u: 'https://nida.nih.gov/publications/research-reports/marijuana/what-are-marijuanas-effects' },
    { a: 'PubMed (CBD review)', u: 'https://pubmed.ncbi.nlm.nih.gov/?term=cannabidiol+review' },
    { a: 'PubMed (THC adverse effects)', u: 'https://pubmed.ncbi.nlm.nih.gov/?term=THC+adverse+effects' },
  ],
}

function pickSources(topicKey, count = 10) {
  const bank = [...(SOURCE_BANK[topicKey] || []), ...SOURCE_BANK.general]
  const out = []
  for (let i = 0; i < Math.min(count, bank.length); i++) out.push(bank[i])
  return out
}

function injectOneCitation(paragraph, sources, idx) {
  if (!paragraph) return paragraph
  if (paragraph.includes('](')) return paragraph // already has a link
  const src = sources[idx % sources.length]
  if (!src) return paragraph
  return `${paragraph} [${src.a}](${src.u}).`
}

function countMarkdownLinks(markdown) {
  const m = String(markdown || '').match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)
  return m ? m.length : 0
}

function normalizeKeyTakeaways(sectionBody, topicKey, sources) {
  const lines = sectionBody.split('\n').map((l) => l.trimEnd())
  const bullets = lines.filter((l) => l.trim().startsWith('- '))
  const need = 5
  const out = []

  const fallback = buildKeyTakeaways(topicKey, '', sources).split('\n')

  for (let i = 0; i < Math.min(need, bullets.length); i++) {
    let b = bullets[i].trim()
    // Ensure "- **X:** ..."
    if (!/^-\s+\*\*.+\*\*:/.test(b)) {
      // Best-effort: wrap first sentence fragment as bold.
      const raw = b.replace(/^-+\s*/, '')
      const parts = raw.split(/:\s+|\.\s+/)
      const head = (parts[0] || 'Key point').replace(/\*\*/g, '').trim()
      const rest = raw.slice(head.length).trim().replace(/^[:.\s]+/, '')
      b = `- **${head}:** ${rest || 'See details below.'}`
    }
    out.push(b)
  }

  for (let i = out.length; i < need; i++) {
    out.push(fallback[i] || fallback[fallback.length - 1])
  }

  return out.join('\n')
}

function ensureNoListsInOpening(markdown) {
  const lines = markdown.split('\n')
  const out = []
  let beforeFirstH2 = true
  const moved = []

  for (const line of lines) {
    if (line.startsWith('## ')) beforeFirstH2 = false
    if (beforeFirstH2 && line.trim().startsWith('- ')) {
      moved.push(line)
      continue
    }
    out.push(line)
  }

  if (moved.length === 0) return markdown

  // Put moved bullets right after first H2 section begins.
  const rebuilt = []
  let inserted = false
  for (let i = 0; i < out.length; i++) {
    rebuilt.push(out[i])
    if (!inserted && out[i].startsWith('## ')) {
      rebuilt.push('')
      rebuilt.push(...moved)
      rebuilt.push('')
      inserted = true
    }
  }
  return rebuilt.join('\n')
}

function normalizeToc(markdown) {
  const h2 = extractH2Titles(markdown)
  const filtered = h2.filter((t) => {
    const lower = t.toLowerCase()
    return lower !== 'key takeaways' && !lower.startsWith('table of contents')
  })
  return `## Table of Contents\n\n${filtered.map((t) => `- ${t}`).join('\n')}\n`
}

function extractMarkdownSectionBody(markdown, headingTitleRegex) {
  const re = new RegExp(`^##\\s+${headingTitleRegex}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'im')
  const m = markdown.match(re)
  return m ? String(m[1] || '').trim() : ''
}

function replaceSection(markdown, headingRegex, newHeading, newBody) {
  const re = new RegExp(`(^##\\s+${headingRegex}[\\s\\S]*?)(?=^##\\s+|\\Z)`, 'im')
  const m = markdown.match(re)
  if (!m) return markdown
  return markdown.replace(re, `${newHeading}\n\n${newBody}\n\n`)
}

function ensureSection(markdown, title, body) {
  if (
    new RegExp(`^##\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im').test(
      markdown
    )
  ) {
    return markdown
  }
  return `${markdown.trim()}\n\n---\n\n## ${title}\n\n<ImagePlaceholder />\n\n${body.trim()}\n`
}

function ensureSectionByRegex(markdown, titleRegex, title, body) {
  if (new RegExp(`^##\\s+${titleRegex}\\s*$`, 'im').test(markdown)) return markdown
  return ensureSection(markdown, title, body)
}

function dedupeH2Section(markdown, exactTitle) {
  const re = new RegExp(`(^##\\s+${exactTitle}\\s*$[\\s\\S]*?)(?=^##\\s+|\\Z)`, 'gim')
  const matches = markdown.match(re)
  if (!matches || matches.length <= 1) return markdown
  // Keep first; remove the rest.
  let out = markdown
  for (let i = 1; i < matches.length; i++) {
    out = out.replace(matches[i], '')
  }
  return out.replace(/\n{3,}/g, '\n\n').trim()
}

function replaceH2Body(markdown, titleRegex, newBody) {
  const re = new RegExp(`(^##\\s+${titleRegex}\\s*$)([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'im')
  const m = markdown.match(re)
  if (!m) return markdown
  return markdown.replace(re, `$1\n\n${newBody.trim()}\n\n`)
}

function hasH2(markdown, titleRegex) {
  return new RegExp(`^##\\s+${titleRegex}\\s*$`, 'im').test(markdown)
}

function normalizeCta(markdown, storeInfo, sources) {
  const ctaBody = buildCtaSection(storeInfo, sources)
    .split('\n')
    .slice(4)
    .join('\n')
    .trim()

  // If there is already a dispensary-style section, replace the *last* one; otherwise append.
  const re = /(^##\s+(.+)\s*$[\s\S]*?)(?=^##\s+|\Z)/gim
  const blocks = []
  let m
  while ((m = re.exec(markdown))) {
    const block = m[1]
    const title = (m[2] || '').trim()
    if (/dispensary|kine\s*buds/i.test(title)) {
      blocks.push({ block, title })
    }
  }

  if (blocks.length === 0) {
    return ensureSection(markdown, `${storeInfo.name} CTA Section`, ctaBody)
  }

  const last = blocks[blocks.length - 1]
  return markdown.replace(
    last.block,
    `## ${storeInfo.name} CTA Section\n\n<ImagePlaceholder />\n\n${ctaBody}\n\n`
  )
}

function buildOpening(topicKey, title, sources) {
  const s0 = sources[0] ? ` [${sources[0].a}](${sources[0].u})` : ''
  const s1 = sources[1] ? ` [${sources[1].a}](${sources[1].u})` : ''
  if (topicKey === 'nj-laws') {
    return [
      `If you’ve ever wondered whether cannabis is “actually legal” in New Jersey—or what’s allowed once you walk out of a licensed dispensary—you’re not alone. A lot of people mix up state rules, federal rules, and what landlords or workplaces can restrict.`,
      `This guide breaks down what adult-use legalization really means in practice: who can buy, how much you can possess, where you can consume, and how to avoid the most common legal mistakes—especially around travel and driving.${s0}`,
      `It’s educational (not legal advice), but it’s designed to make you feel confident before you shop and to help you use cannabis more responsibly once you do.${s1}`,
    ].join('\n\n')
  }
  return [
    `Most people don’t need “more information” about cannabis—they need clearer, more practical guidance. Between myths, half-remembered advice from friends, and fast-changing regulations, it’s easy to feel unsure.`,
    `This article answers the questions that actually matter for real life: what the product labels mean, how effects can differ person-to-person, and how to make safer choices while staying within the rules.${s0}`,
    `We’ll keep the tone conversational, but every major claim is meant to be grounded in reputable sources so you can verify details yourself.${s1}`,
  ].join('\n\n')
}

function buildKeyTakeaways(topicKey, nounTitle, sources) {
  const src = (i) => (sources[i] ? `[${sources[i].a}](${sources[i].u})` : '[PubMed](https://pubmed.ncbi.nlm.nih.gov/)')
  if (topicKey === 'nj-laws') {
    return [
      `- **Know the legal baseline before you shop:** Adult-use is legal in NJ for 21+, but rules on possession, consumption, and transport still apply (${src(0)}).`,
      `- **Treat driving as “zero gray area”:** Cannabis impairment + driving risk is real—plan a ride, not a debate (${src(3)}).`,
      `- **Don’t cross state lines with cannabis:** Even if both states are “legal,” interstate transport can trigger federal issues (${src(2)}).`,
      `- **Match product type to your timeline:** Inhalation tends to hit faster; edibles can feel delayed and then stronger (${src(1)}).`,
      `- **Use receipts and packaging as your paper trail:** It’s a simple habit that can reduce headaches if questions come up (${src(0)}).`,
    ].join('\n')
  }
  return [
    `- **Start low and stay patient:** Dose and onset vary by product—especially with edibles (${src(0)}).`,
    `- **Read labels like a checklist:** THC/CBD, serving size, and total milligrams drive the experience (${src(2)}).`,
    `- **Expect variability:** Effects differ by tolerance, metabolism, and context (${src(1)}).`,
    `- **Choose products that fit your goal:** Relaxation, focus, or sleep often map to different formats and ratios (${src(4)}).`,
    `- **When in doubt, ask a trained budtender:** Good dispensaries help you make safer, more informed picks (${src(0)}).`,
  ].join('\n')
}

function addImagePlaceholdersAndDividers(markdown) {
  const lines = markdown.split('\n')
  const out = []
  let firstH2Seen = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      if (firstH2Seen) out.push('\n---\n')
      firstH2Seen = true
      out.push(line)
      out.push('')
      out.push('<ImagePlaceholder />')
      out.push('')
      continue
    }
    out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function extractH2Titles(markdown) {
  const titles = []
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) titles.push(line.replace(/^##\s+/, '').trim())
  }
  return titles
}

function normalizeH2ImageTags(markdown) {
  const lines = markdown.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    out.push(line)
    if (line.startsWith('## ')) {
      // Look ahead for next non-empty line
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') {
        out.push(lines[j])
        j++
        i++
      }
      if (j < lines.length && lines[j].trim() === '<ImagePlaceholder />') {
        // already has it, continue
        continue
      }
      out.push('')
      out.push('<ImagePlaceholder />')
      out.push('')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function buildFaq(topicKey, sources) {
  const src = (i) => (sources[i] ? `[${sources[i].a}](${sources[i].u})` : '[PubMed](https://pubmed.ncbi.nlm.nih.gov/)')
  const faqs =
    topicKey === 'nj-laws'
      ? [
          ['Is cannabis legal in New Jersey for adults?', `Yes—adult-use is legal for 21+ in New Jersey, but it’s regulated (not “anything goes”). The NJ Cannabis Regulatory Commission publishes consumer guidance and rules around purchase and possession (${src(0)}).`],
          ['Can I smoke cannabis in public in New Jersey?', `In general, public consumption is restricted, and property owners can also set rules. Always check current state guidance and local policies (${src(1)}).`],
          ['Can I take cannabis from New Jersey to New York (or another legal state)?', `No—crossing state lines with cannabis can violate federal law even if both states allow adult-use (${src(2)}). The simplest rule: purchase and consume within the same state.`],
          ['How much cannabis can I possess in New Jersey?', `New Jersey sets possession limits that vary by product type (flower vs concentrates vs edibles). Use the official NJ guidance for up-to-date limits (${src(0)}).`],
          ['What should I do if I feel “too high”?', `Move to a calm environment, hydrate, and wait it out; effects are time-limited. If you’re concerned about severe symptoms, seek medical help. For product onset/variability, see general health guidance (${src(6)}).`],
          ['Does cannabis affect driving the next day?', `It can for some people, especially with high doses or edibles. Avoid driving if you feel impaired, and plan conservatively (${src(4)}).`],
          ['Is cannabis still illegal under federal law?', `Cannabis remains federally restricted, which is why interstate transport and federal property are special risk areas (${src(2)}).`],
          ['Do landlords or employers have to allow cannabis use?', `No—private policies can restrict use and possession on their property or in the workplace. Check your lease and workplace rules (${src(0)}).`],
        ]
      : [
          ['How long do cannabis effects last?', `Duration depends on format and dose. Inhalation often peaks sooner; edibles last longer and can feel stronger once they kick in (${src(0)}).`],
          ['What’s the difference between THC and CBD?', `THC is the primary intoxicating cannabinoid; CBD is non-intoxicating and may change the subjective feel for some people (${src(1)}).`],
          ['Can I build tolerance quickly?', `Frequent use can change how strongly you feel effects. If you’re using often, consider structured breaks and lower doses (${src(2)}).`],
          ['Are edibles “stronger” than smoking?', `They can feel that way because oral THC is metabolized differently and effects can be delayed, leading to overconsumption (${src(0)}).`],
          ['What should beginners buy first?', `Many beginners do best with low-dose, clearly-labeled products and a plan to go slow. A good dispensary team can help match goals to formats (${src(5)}).`],
          ['Can cannabis cause anxiety?', `Higher THC doses can increase anxiety in some people. Lower doses and balanced THC:CBD options may feel steadier for some users (${src(1)}).`],
          ['Is cannabis safe during pregnancy or breastfeeding?', `Health authorities generally advise against cannabis during pregnancy/breastfeeding. If you need guidance, talk with a clinician (${src(6)}).`],
          ['What if I take too much?', `Time, calm surroundings, hydration, and reassurance help. If severe symptoms occur, seek medical care (${src(6)}).`],
        ]

  return (
    `## FAQ\n\n` +
    faqs
      .map(([q, a]) => {
        return `### ${q}\n\n${a}\n\n${injectOneCitation(
          `Practical tip: write down the product name, THC/CBD amounts, and timing so you can adjust next time.`,
          sources,
          3
        )}\n`
      })
      .join('\n')
      .trim()
  )
}

function buildBottomLine(title, sources) {
  const s0 = sources[0] ? `[${sources[0].a}](${sources[0].u})` : '[CDC cannabis](https://www.cdc.gov/cannabis/index.html)'
  const cleanTitle = title.replace(/^The\s+/i, '').trim()
  return `## The Bottom Line on ${cleanTitle}\n\n<ImagePlaceholder />\n\nThe most useful cannabis guidance is the kind you can apply in real life: know the rules, choose products that match your timeline, and keep your dose conservative until you understand how your body responds.\n\nIf there’s one theme that shows up across reputable sources, it’s variability—product format, dose, tolerance, and context all change the experience. That’s why “start low, go slow” stays relevant even when you’ve used cannabis before.\n\nUse authoritative references as a safety net, not a replacement for common sense. When you’re unsure, default to the cautious option and verify details through official guidance like ${s0}.\n\nFinally, keep the goal simple: a consistent, predictable experience. That usually comes from repeatable dosing, clear labeling, and asking questions before you buy—not after you’re already uncomfortable.\n`
}

function buildCtaSection(storeInfo, sources) {
  const s0 = sources[0] ? `[${sources[0].a}](${sources[0].u})` : '[NJ Cannabis Regulatory Commission](https://www.nj.gov/cannabis/)'
  return `## ${storeInfo.name} CTA Section\n\n<ImagePlaceholder />\n\nIf you want help turning this information into a real-world shopping plan, our team can walk you through product types, labeling, and safer starting doses—without the pressure or hype.\n\nWe focus on clarity: what’s in the product, how people typically use it, and how to build a “first purchase” that fits your comfort level and schedule. For state rules and consumer guidance, we also point customers toward official references like ${s0}.\n\n**Visit us at ${storeInfo.address} · Hours: ${storeInfo.hours} · Phone: ${storeInfo.phone}.**\n`
}

function extractStoreInfoFromXml(xml) {
  // Best-effort extraction from anywhere in the export.
  const phoneMatch = xml.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/)
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : 'Call for details'

  const addrMatch =
    xml.match(/\d{1,6}\s+[^<\n,]+,\s*Maywood,\s*NJ\s*\d{5}/i) ||
    xml.match(/\d{1,6}\s+[^<\n,]+,\s*Maywood,\s*New Jersey\s*\d{5}/i)
  const address = addrMatch ? addrMatch[0].replace(/\s+/g, ' ').trim() : 'Maywood, NJ'

  const hoursMatch = xml.match(/(Mon|Monday)[\s\S]{0,120}?(Sun|Sunday)[\s\S]{0,120}?(\d{1,2}(:\d{2})?\s*(AM|PM))/i)
  const hours = hoursMatch ? 'See website for current hours' : 'See website for current hours'

  return {
    name: 'KineBuds Dispensary',
    address,
    hours,
    phone,
  }
}

// --- main ---
const xml = fs.readFileSync(inputPath, 'utf8')
const storeInfo = extractStoreInfoFromXml(xml)

const items = splitItems(xml)
const posts = items
  .map((item) => {
    const postType = extractCdata(item, 'wp:post_type')
    const status = extractCdata(item, 'wp:status')
    if (postType !== 'post' || status !== 'publish') return null

    const title = extractCdata(item, 'title')
    const wpId = extractCdata(item, 'wp:post_id')
    const wpSlug = extractCdata(item, 'wp:post_name')
    const pubDate = extractCdata(item, 'wp:post_date') || extractCdata(item, 'pubDate')
    const author = extractCdata(item, 'dc:creator') || 'KineBuds Dispensary'
    const html = extractCdata(item, 'content:encoded')
    const categories = findAllCategories(item)
    const wpCategories = categories
      .filter((c) => c.domain === 'category')
      .map((c) => ({
        name: textOnly(c.label),
        slug: slugify(textOnly(c.label)),
      }))
      .filter((c) => c.slug)

    const slug = slugify(wpSlug || title)
    const topicKey = inferTopicKey(title)
    const sources = pickSources(topicKey, 20)

    // Convert Gutenberg HTML to markdown.
    let md = htmlToMarkdown(html)
    md = md.replace(/^#\s+.+\n+/m, '') // avoid duplicated H1 from source
    md = md.replace(/^##\s+Table of Contents\+?\s*$/gim, '## Table of Contents')

    // Do NOT include H1 in MDX content; the page provides the title.
    md = md.trim()

    // Ensure there's a prose-only opening (no bullets before first H2).
    md = ensureNoListsInOpening(md)

    const linksCountBefore = countMarkdownLinks(md)

    // If the source doesn't include required sections, add them (but avoid rewriting existing ones).
    if (!hasH2(md, 'Key Takeaways')) {
      const body = md.replace(/^#\s+.+\n+/m, '').trim()
      md = `${buildOpening(topicKey, title, sources)}\n\n## Key Takeaways\n\n${buildKeyTakeaways(
        topicKey,
        title,
        sources
      )}\n\n## Table of Contents\n\nTOC_PLACEHOLDER\n\n---\n\n${body}\n`
    }

    // Ensure a TOC section exists (we'll always regenerate its contents later).
    if (!hasH2(md, 'Table of Contents\\+?')) {
      md = md.replace(
        /(^##\s+Key Takeaways[\s\S]*?)(?=^##\s+|\Z)/im,
        (m) => `${m.trim()}\n\n## Table of Contents\n\nTOC_PLACEHOLDER\n\n`
      )
    }
    md = md.replace(/^##\s+Table of Contents\+?\s*$/gim, '## Table of Contents')
    md = replaceH2Body(md, 'Table of Contents', 'TOC_PLACEHOLDER')

    // Remove duplicates if the source content contains repeated sections.
    md = dedupeH2Section(md, 'Key Takeaways')
    md = dedupeH2Section(md, 'Table of Contents')

    // Add dividers + required <image> placeholders per H2.
    md = addImagePlaceholdersAndDividers(md)
    md = normalizeH2ImageTags(md)

    // Ensure Bottom Line and FAQ exist.
    if (!/^##\s+The Bottom Line on/i.test(md)) {
      md = ensureSectionByRegex(
        md,
        'The Bottom Line on[\\s\\S]+',
        buildBottomLine(title, sources).split('\n')[0].replace(/^##\s+/, ''),
        buildBottomLine(title, sources).split('\n').slice(4).join('\n')
      )
    }
    if (!hasH2(md, 'FAQ')) {
      md = ensureSection(md, 'FAQ', buildFaq(topicKey, sources).split('\n').slice(3).join('\n'))
    }

    // Normalize/ensure CTA and make it last.
    md = normalizeCta(md, storeInfo, sources)

    // Regenerate TOC from final H2 headings (H2-only, no subsections).
    md = md.replace(
      'TOC_PLACEHOLDER',
      normalizeToc(md).replace(/^## Table of Contents\s*/i, '').trim()
    )

    // Add citations if the document is link-light.
    const linksCountAfter = countMarkdownLinks(md)
    const needsCitationHelp = linksCountAfter < 40 && linksCountBefore < 25
    if (needsCitationHelp) {
      md = md
        .split('\n')
        .map((line, idx) => {
          const t = line.trim()
          if (!t) return line
          if (t.startsWith('#')) return line
          if (t.startsWith('- ')) return line
          if (t === '<ImagePlaceholder />') return line
          if (t === '---') return line
          return injectOneCitation(line, sources, idx)
        })
        .join('\n')
    }

    const description =
      textOnly(extractCdata(item, 'excerpt:encoded')).slice(0, 160) ||
      `Source-heavy cannabis education resource: ${title}`

    const mdx = [
      `export const metadata = ${JSON.stringify(
        {
          title,
          description,
          date: pubDate ? String(pubDate).slice(0, 10) : undefined,
          author,
          category: 'Resources',
          wpCategories,
          tags: Array.from(new Set(categories.filter((c) => c.domain === 'post_tag').map((c) => textOnly(c.label))))
            .slice(0, 12),
          wpId: wpId || undefined,
        },
        null,
        2
      )}\n`,
      `${md.trim()}\n`,
    ].join('\n')

    return { slug, mdx }
  })
  .filter(Boolean)

console.log(`Found ${posts.length} published WP posts.`)

let written = 0
for (const p of posts) {
  const outPath = path.join(outDir, `${p.slug}.mdx`)
  fs.writeFileSync(outPath, p.mdx, 'utf8')
  written++
}

console.log(`Wrote ${written} resource articles to ${outDir}`)

