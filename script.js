// /* ══════════════════════════════════════════════════════
//     DRAG-TO-SWIPE FILMSTRIP
//     ─ Follows pointer/touch 1:1 horizontally while dragging
//     ─ Distinguishes horizontal vs vertical intent (4 px threshold)
//     so vertical frame scrolling is never intercepted
//     ─ Snaps to nearest frame with a spring ease on release
//     ─ Nav tabs stay in sync at all times
//     ══════════════════════════════════════════════════════ */

/* ── FILMSTRIP DRAG ── */
const strip = document.getElementById('filmstrip');
const tabs = Array.from(document.querySelectorAll('.nav-tab'));
const N = 3;
let currentIdx = 0, offset = 0, dragStartX = 0, dragStartY = 0, dragBaseOff = 0, dragging = false, isHoriz = false, intentLock = false;
const VW = () => window.innerWidth;
function applyX(x, animated) { strip.style.transition = animated ? 'transform 0.52s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none'; strip.style.transform = `translateX(${x}px)`; }
function snapTo(idx) { currentIdx = Math.max(0, Math.min(N - 1, idx)); offset = -currentIdx * VW(); applyX(offset, true); syncNav(currentIdx); document.getElementById('swipe-hint').style.display = 'none'; }
function goToFrame(idx) { snapTo(idx); }
function syncNav(idx) { tabs.forEach((t, i) => t.classList.toggle('active', i === idx)); }
function onStart(x, y) { dragStartX = x; dragStartY = y; dragBaseOff = offset; dragging = true; isHoriz = false; intentLock = false; strip.style.transition = 'none'; }
function onMove(x, y) { if (!dragging) return; const dx = x - dragStartX, dy = y - dragStartY; if (!intentLock && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) { isHoriz = Math.abs(dx) >= Math.abs(dy); intentLock = true; if (!isHoriz) { dragging = false; return; } } if (!intentLock || !isHoriz) return; const raw = dragBaseOff + dx, minOff = -(N - 1) * VW(); let clamped = raw; if (raw > 0) clamped = raw * .18; if (raw < minOff) clamped = minOff + (raw - minOff) * .18; strip.style.transform = `translateX(${clamped}px)`; }
function onEnd(x) { if (!dragging || !isHoriz) { dragging = false; return; } dragging = false; const dx = x - dragStartX, threshold = VW() * .15; let target = currentIdx; if (dx < -threshold) target = Math.min(N - 1, currentIdx + 1); else if (dx > threshold) target = Math.max(0, currentIdx - 1); snapTo(target); }
document.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
document.addEventListener('mousemove', e => { if (dragging) onMove(e.clientX, e.clientY); });
document.addEventListener('mouseup', e => onEnd(e.clientX));
document.addEventListener('mouseleave', e => { if (dragging) onEnd(e.clientX); });
document.addEventListener('touchstart', e => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
document.addEventListener('touchmove', e => { const t = e.touches[0]; if (dragging && !intentLock) { onMove(t.clientX, t.clientY); return; } if (dragging && isHoriz) { e.preventDefault(); onMove(t.clientX, t.clientY); } }, { passive: false });
document.addEventListener('touchend', e => { const t = e.changedTouches[0]; onEnd(t.clientX); });
document.addEventListener('keydown', e => { if (document.getElementById('project-overlay').classList.contains('open')) return; if (e.key === 'ArrowRight') snapTo(currentIdx + 1); if (e.key === 'ArrowLeft') snapTo(currentIdx - 1); });
window.addEventListener('resize', () => { offset = -currentIdx * VW(); applyX(offset, false); });
applyX(0, false); syncNav(0);

/* ── MEDIA HELPERS ── */
function renderMediaItem(item, fg) {
  if (!item) return `<div class="evidence-placeholder" style="background:${fg}">Add media here</div>`;
  if (typeof item === 'string') return `<div class="evidence-img-wrap"><img src="${item}" alt="" loading="lazy"/></div>`;
  switch (item.type) {
    case 'image':
      return `
    <div class="evidence-img-item ${item.format || ''}">
      <div class="evidence-img-wrap">
        <img src="${item.src}" alt="${item.alt || ''}" loading="lazy"/>
      </div>

      ${item.caption ? `<p class="evidence-label">${item.caption}</p>` : ''}
    </div>
  `; case 'video':
      return `
    <div class="evidence-video-item ${item.format || 'landscape'}">
      <div class="evidence-video-wrap">
        <video autoplay muted loop playsinline poster="${item.poster || ''}">
          <source src="${item.src}" type="video/mp4">
        </video>
      </div>

      ${item.caption ? `<p class="evidence-label">${item.caption}</p>` : ''}
    </div>
  `;
    case 'iframe': return `<div class="evidence-iframe-wrap">${item.caption ? `<p class="evidence-label">${item.caption}</p>` : ''}<iframe src="${item.src}" allowfullscreen loading="lazy"></iframe>${item.link ? `<a class="evidence-link" href="${item.link}" target="_blank">Open full prototype ↗</a>` : ''}</div>`;
    case 'placeholder': return `<div class="evidence-placeholder" style="background:${fg}">${item.label || 'Add media here'}</div>`;
    default: return `<div class="evidence-placeholder" style="background:${fg}">Add media here</div>`;
  }
}
function buildEvidenceGallery(mediaArray, fg, label) {
  if (!mediaArray || mediaArray.length === 0) {
    return '';
  }

  let html = `<div class="evidence-gallery">`;
  let pairBuffer = [];

  mediaArray.forEach(item => {
    const format = item.format || 'landscape';

    // Landscape takes one full row
    if (format === 'landscape') {
      // Flush any waiting portrait/square items first
      if (pairBuffer.length > 0) {
        html += `
          <div class="evidence-row evidence-row--pair">
            ${pairBuffer.map(bufferItem => `
              <div class="evidence-cell">
                ${renderMediaItem(bufferItem, fg)}
              </div>
            `).join('')}
          </div>
        `;
        pairBuffer = [];
      }

      html += `
        <div class="evidence-row evidence-row--full">
          <div class="evidence-cell">
            ${renderMediaItem(item, fg)}
          </div>
        </div>
      `;
    }

    // Portrait / square waits to be paired
    // Portrait / square waits to be grouped
    else {
      pairBuffer.push(item);

      if (pairBuffer.length === 3) {
        html += `
      <div class="evidence-row evidence-row--triple">
        ${pairBuffer.map(bufferItem => `
          <div class="evidence-cell">
            ${renderMediaItem(bufferItem, fg)}
          </div>
        `).join('')}
      </div>
    `;
        pairBuffer = [];
      }
    }
  });

  // Flush remaining single portrait/square item
  if (pairBuffer.length > 0) {
    html += `
    <div class="evidence-row evidence-row--triple evidence-row--${pairBuffer.length}">
      ${pairBuffer.map(bufferItem => `
        <div class="evidence-cell">
          ${renderMediaItem(bufferItem, fg)}
        </div>
      `).join('')}
    </div>
  `;
  }

  html += `</div>`;

  return html;
}

/* ── FLEXIBLE IMAGE GALLERY ── */
/*
  Images:
  - regular / square / portrait: max 3 per row
  - 4 images: 2 + 2
  - 5 images: 3 + 2
  - landscape images: max 2 per row

  Videos / iframe / placeholder:
  - keep existing buildEvidenceGallery() layout
*/

function chunkImages(items, maxPerRow) {
  const rows = [];
  let i = 0;

  while (i < items.length) {
    const remaining = items.length - i;

    // For regular images: avoid 3 + 1
    if (maxPerRow === 3 && remaining === 4) {
      rows.push(items.slice(i, i + 2));
      rows.push(items.slice(i + 2, i + 4));
      break;
    }

    rows.push(items.slice(i, i + Math.min(maxPerRow, remaining)));
    i += maxPerRow;
  }

  return rows;
}

function renderImageRows(items, fg, mode) {
  if (!items || items.length === 0) return '';

  const maxPerRow = mode === 'landscape' ? 2 : 3;
  const rows = chunkImages(items, maxPerRow);

  return `
    <div class="flex-evidence-gallery flex-evidence-gallery--${mode}">
      ${rows.map(row => `
        <div class="flex-evidence-row flex-evidence-row--${mode} flex-evidence-row--${row.length}">
          ${row.map(item => `
            <div class="flex-evidence-card">
              ${renderMediaItem(item, fg)}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function buildFlexibleEvidenceGallery(mediaArray, fg, label) {
  if (!mediaArray || mediaArray.length === 0) {
    return '';
  }

  const regularImages = mediaArray.filter(item =>
    item.type === 'image' && item.format !== 'landscape'
  );

  const landscapeImages = mediaArray.filter(item =>
    item.type === 'image' && item.format === 'landscape'
  );

  const otherMedia = mediaArray.filter(item =>
    item.type !== 'image'
  );

  return `
    ${regularImages.length ? renderImageRows(regularImages, fg, 'regular') : ''}
    ${landscapeImages.length ? renderImageRows(landscapeImages, fg, 'landscape') : ''}
    ${otherMedia.length ? buildEvidenceGallery(otherMedia, fg, label) : ''}
  `;
}

/* ── PROJECT DATA ── */
const projects = {
  'sun-safety': {
    name: 'Sun Scanner',
    type: 'UX Research · Co-design · UX/UI Design · Health Behaviour',
    year: '2026',
    hc: ['#FFF7C7', '#8FB7FF'],
    hl: 'Making UV Risk Visible Before It Becomes Damage',

    context: {
      sub: 'Sun Safety Awareness <br>of Young Adults',
      body: `
      Sun Scanner is a co-design project exploring how young adults perceive UV risks and make sun-protection decisions in everyday life.

      <br><br>

      The project began with a clear tension: young adults often know sun protection matters, but their actual behaviour is shaped by comfort, convenience, appearance, weather perception, and personal experiences about UV and products.

      <br><br>

Working in a team, we translated workshop insights into an AR-supported mobile app concept that helps young adults visualise invisible UV risk through skin scanning, personalised feedback, and actionable sun-protection guidance.    `,

      meta: [
        { l: 'Role', v: 'Workshop Facilitator <br>UX/UI Designer' },
        { l: 'Methods', v: 'Workshops <br>Co-design <br>Thematic Analysis' },
        { l: 'Output', v: 'Sun Safety Concept Development<br>Hi-fidelity Wireframes' }
      ],

      evidence: [
        {
          type: 'video',
          format: 'portrait',
          src: 'img_sun/uv-web.mp4',
          caption: 'UV on the forefront and clear interpretation of weather app'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_sun/scan-web.mp4',
          caption: 'Skin Scanner showing areas of your skin being protected/damaged'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_sun/action-web.mp4',
          caption: 'Allow actionable plan for sun protection habits'
        },
      ]
    },

    solution: {
      sub: 'An AR-intergrated Weather App Rebuilt Around UV',
      body: `
      Instead of asking users to build a new habit from scratch, the app places sun safety inside something they already do: checking the weather. The Home screen shows the daily UV index, peak-risk time, and a simple protection checklist. The Learn tab provides accessible sun-safety information about UV, SPF, skin damage, and protection methods.

      <br><br>

      The main feature is Skin Mirror, an AR skin scanner that helps users scan their skin before and after sun exposure. Before going outside, it highlights areas that may need more protection. After exposure, it helps users understand possible exposure patterns and receive personalised prevention tips.

      <br><br>

      The filter is responsive to young adults' interests as it can be intergrated in other social media platforms. 
      `,

      metrics: [
        { n: '1', d: 'Portable' },
        { n: '2', d: 'Visible' },
        { n: '3', d: 'Actionable' },
        { n: '2', d: 'Joyful and Updated' },
      ],

      evidence: [
        {
          type: 'image',
          format: 'landscape',
          src: 'img_sun/hi-fi.webp',
        }
      ]
    },

    intent: {
      sub: 'The Challenge',
      body: `
In Australia, UV exposure carries serious long-term health risks, including one of the world’s highest skin cancer burdens.

<br><br>

Yet our research showed that young adults rarely make sun-protection decisions through UV knowledge alone. Instead, they rely on immediate cues: heat, brightness, clothing, comfort, convenience, appearance, and product trust.

<br><br>

This created the core problem: UV risk is high, but it is often invisible, hidden, or easy to ignore at the moment protection decisions are made.
`,

      quote: `"How might we make invisible UV risk visible and personally relevant, so young adults can act earlier without making sun protection feel like another task?"`,

      evidence: [
        {
          type: 'image',
          src: 'img_sun/pop-up.webp',
          caption: 'Pop-up and literature findings: awareness exists, but protection remains inconsistent'
        }
      ]
    },

    moves: {
      sub: 'Co-design Process & Methodology',
      layout: 'flexible',
      steps: [
        {
          n: '01',
          t: 'Exploring Workshop: Map Real Behaviour',
          b: `
          We used a misconception scale and sun-safety journey map to understand how participants made protection decisions across a normal university day.
        `
        },
        {
          n: '02',
          t: 'Exploring Workshop: Find the Barriers',
          b: `
          Thematic analysis revealed that sun protection was not just an awareness issue. It was affected by comfort, trust, visible skin, weather cues, and routine.
        `
        },
        {
          n: '03',
          t: 'Co-design Interventions',
          b: `
          We used Crazy 4s, SCAMPER, and voting to help participants generate and refine possible digital interventions.
        `
        },
        {
          n: '04',
          t: 'Select the Strongest Direction',
          b: `
          The top ideas pointed toward visualisation, portability, and practical guidance. “Skin damage before and after visualisation” became the strongest foundation for the final concept.
        `
        },
        {
          n: '05',
          t: 'Build Around an Existing Habit',
          b: `
          We combined the visualisation concept with a familiar weather-app pattern, so UV awareness could sit inside a routine users already perform.
        `
        }
      ],

      evidence: [
        {
          type: 'image',
          format: 'landscape',
          src: 'img_sun/overview.webp',
          caption: 'Process and Methodologies'
        }
      ]
    },

    reflection: {
      sub: 'What I Learned',
      body: `
        This project taught me that health behaviour is shaped by small, immediate trade-offs. People may care about long-term risk, but daily decisions are often made through comfort, time, appearance, weather cues, and trust.

        <br><br>

        I also learned that co-design needs structure. The exploratory workshop helped us understand participants’ real behaviours, while the co-design workshop helped turn those behaviours into design criteria. This made the final concept more grounded than a generic awareness app.

        <br><br>

        Working in a team also taught me that collaboration can be difficult when people have different personalities, working styles, and ways of making decisions. Clear roles, communication, facilitation, and documentation became essential to keep the workshop process focused and productive.

        <br><br>

        If I continued the project, I would test whether the Skin Mirror feature feels motivating or too confronting. I would also refine how the app communicates UV risk without using fear or shame.
        `,

      evidence: [
        {
          type: 'image',
          format: 'landscape',
          src: 'img_sun/ref.webp',
          caption: 'Co-design Process'
        }
      ]
    }
  },

  'peace': {
    name: 'Peace — Mental Health Support Agency',
    type: 'Service Design · UX/UI Design · Mental Health Access',
    year: '2025',
    hc: ['#EAE8EF', '#7C88A8'],
    hl: 'Helping Young Adults Find the Right Mental Health Support',

    context: {
      sub: 'Peace <br> Mental Health Support Agency',

      body: `
      Peace is a service and UX design project developed in a team of three, responding to the mental health access gap experienced by young adults in Australia.

      <br><br>

      The idea emerged from our shared observation that many young people are affected by anxiety, stress, loneliness, and emotional instability, yet often struggle to find suitable professional support when they need it.

      <br><br>

      Existing pathways can feel fragmented, expensive, intimidating, and difficult to navigate — especially for students, young professionals, international students, and people from culturally diverse backgrounds.

      <br><br>

      My role spanned research synthesis, service framing, user flow development, UX/UI design, and prototyping across the app and service touchpoints.
    `,

      meta: [
        {
          l: 'Role',
          v: 'Service & UX Designer'
        },
        {
          l: 'Team',
          v: 'Group Project'
        },
        {
          l: 'Output',
          v: 'Mental Health Support Agency<br>App System'
        }
      ],

      evidence: [
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/log-web.mp4',
          caption: 'Log-in'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/emo-web.mp4',
          caption: 'Emotion Check-in'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/book-web.mp4',
          caption: 'Booking session'
        }
      ]
    },

    solution: {
      sub: 'Final Design',

      body: `
      The final outcome is Peace — a mental health support agency supported by an omnichannel digital system.

      <br><br>

      Peace helps young adults articulate their needs, compare suitable therapists, understand available options, and book support with greater confidence. The system includes therapist matching, preference-based filters, simplified booking, emotional check-ins, and support tools for the waiting period before therapy begins.

      <br><br>

      Rather than replacing professional care, Peace acts as a guided access layer between young people and mental health providers, reducing uncertainty and helping users feel more prepared to take the first step.
    `,

      metrics: [
        {
          n: '1',
          d: 'Omni-Channels'
        },
        {
          n: '2',
          d: 'Instant Support'
        },
        {
          n: '3',
          d: 'Flexible and Personalised'
        }
      ],

      evidence: [
        {
          type: 'video',
          format: 'landscape',
          src: 'img_peace/dashboard-web.mp4',
          poster: 'img_peace/dashboard-cover.webp',
          caption: 'Professional Management System'
        },
        {
          type: 'video',
          format: 'landscape',
          src: 'img_peace/therapist-web.mp4',
          poster: 'img_peace/therapists-cover.webp',
          caption: 'Therapist Profile & Matching Interface'
        },
        {
          type: 'video',
          format: 'landscape',
          src: 'img_peace/patient-web.mp4',
          poster: 'img_peace/patient-cover.webp',
          caption: 'Patient Profile & Booking Flow'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/fil-web.mp4',
          caption: 'Advanced filters to match suitable psychotherapist'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/rate-web.mp4',
          caption: 'Rate and review after session'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/det-web.mp4',
          caption: 'Schedule Confirmation'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/pro-web.mp4',
          caption: 'Therapist Profile'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/gen-web.mp4',
          caption: 'AI Support'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/se-web.mp4',
          caption: 'Searching Function'
        },
        {
          type: 'video',
          format: 'square',
          src: 'img_peace/watch-interface-web.mp4',
          poster: 'img_peace/watch-interface-cover.webp',
          caption: 'Smartwatch Emotional Support'
        },
        {
          type: 'video',
          format: 'portrait',
          src: 'img_peace/mul-web.mp4',
          caption: 'Multi-Channel Connection'
        }
      ]
    },
    intent: {
      sub: 'The Challenge',

      body: `
      Young adults in Australia often face significant barriers when seeking mental health care, including high costs, long waiting times, therapist mismatch, cultural differences, and uncertainty about where to start.

      <br><br>

      Through our research, we found that the challenge was not only about providing more information. Many young people already know that support exists, but they lack guidance, trust, and emotional reassurance when deciding who to contact and whether a therapist is suitable for them.
    `,

      quote: `"How might we create a more supportive and trustworthy pathway for young adults to find mental health professionals who match their needs, preferences, and personal context?
    "`,
      evidence: [
        {
          type: 'image',
          format: 'landscape',
          src: 'img_peace/wsb.webp',
          caption: 'Smart Watch Instant Support Scenario'
        },
        {
          type: 'image',
          format: 'landscape',
          src: 'img_peace/booksb.webp',
          caption: 'Easy Booking System Scenario'
        }
      ]
    },

    moves: {
      sub: 'Process & Methodology',

      steps: [
        {
          n: '01',
          t: 'Research',
          b: `
          We conducted secondary research, online ethnography, interviews, and surveys to understand how young adults currently seek mental health support in Australia.

          Key barriers included cost, wait time, therapist mismatch, distrust, cultural sensitivity, and difficulty knowing where to start.
        `
        },
        {
          n: '02',
          t: 'Synthesis',
          b: `
          Using affinity mapping and service design methods, we reframed mental health access as a matching and support journey rather than a simple information-search problem.

          We identified critical drop-off points around discovery, trust-building, booking, and the waiting period before the first session.
        `
        },
        {
          n: '03',
          t: 'Concept Development',
          b: `
          As a team, we explored multiple service directions before developing Peace as a mental health support agency that helps young people connect with suitable therapists.

          The concept focused on preference-based matching, clearer therapist profiles, simplified booking, and emotional support before and between sessions.
        `
        },
        {
          n: '04',
          t: 'Prototype & Test',
          b: `
          We developed mid-fidelity prototypes and tested the service flow with users.

          Feedback helped us refine the experience from a functional booking platform into a more emotionally supportive system that builds confidence, trust, and readiness to seek care.
        `
        }
      ],
      evidence: []
    },

    reflection: {
      sub: 'Learnings',

      body: `
      This project deepened my understanding of designing for sensitive and emotionally complex service contexts.

      <br><br>

      Working in a team taught me how to communicate design decisions clearly, negotiate different perspectives, and use research evidence to align the group around a stronger concept. The project evolved significantly through discussion, prototyping, and user feedback, which helped us move beyond assumptions and develop a more grounded service direction.

      <br><br>

      I also learned that designing for mental health access requires more than efficiency. Every touchpoint needs to support trust, emotional safety, clarity, and personal relevance.
    `,

      pts: [
        'Service design extends beyond the app interface into the full journey before, during, and after seeking care.',
        'User testing helped transform the concept from a simple booking system into a more supportive matching service.',
        'If I continued the project, I would further develop the therapist matching logic and emotional onboarding experience.'
      ],

      evidence: []
    }
  },


  'choco': {
    name: 'CHOCO EMO',
    type: 'Product Design · Campaign Strategy · Packaging Experience',
    year: '2025',
    hc: ['#99AEEF', '#6A3E35'],
    hl: 'Every Emotion Deserves a Choco Treat',

    context: {
      sub: 'CHOCO EMO <br>A limited-edition chocolate box for your emotions',
      body: `The brief was to select a nominated entry from an awards competition and create a chocolate campaign to promote it. I chose <em>Inside Out 2</em>, translating its emotional narrative into a tangible product and multisensory experience.<br /><br />
CHOCO EMO is a limited-edition chocolate box designed to transform emotions into an interactive ritual. My role covered concept development, 3D modelling, material simulation, packaging design, and campaign poster creation.`,
      meta: [
        { l: 'Role', v: 'Concept, Packaging & Campaign Designer' },
        { l: 'Brief', v: 'Award-based Chocolate Campaign' },
        { l: 'Output', v: 'Packaging System + Campaign Poster' }
      ],
      evidence: [
        {
          type: 'image',
          src: 'img_cho/pos.webp',
          caption: 'Final Advertising Poster'
        }
      ]
    },

    solution: {
      sub: 'Final Design',
      body: `The final outcome is a multisensory campaign and packaging system where product, form, and message work together as an emotional awareness ritual. The design reframes chocolate as more than a snack: it becomes a small moment of reflection, self-kindness, and emotional recognition.`,
      metrics: [
        { n: '01', d: 'Emotion-based chocolate collection' },
        { n: '02', d: 'Laser-cut treasure box packaging' },
        { n: '03', d: 'Campaign poster and visual identity' }
      ],
      evidence: [
        {
          type: 'image',
          src: 'img_cho/barcho.webp',
          format: 'landscape',
          caption: 'Emotion-Inspired 3D Models and Chocolates'
        },
        {
          type: 'image',
          src: 'img_cho/las.webp',
          format: 'landscape',
          caption: 'Laser Cutting Product'
        }
      ]
    },

    intent: {
      sub: 'The Challenge',
      body: `Emotions are often overlooked or suppressed in everyday life, especially those perceived as negative. Inspired by <em>Inside Out 2</em>, this project asked how a chocolate campaign could make emotional awareness feel tangible, approachable, and memorable.`,
      quote: `"How might we transform chocolate from a simple indulgence into a small emotional ritual?"`,
      evidence: []
    },

    moves: {
      sub: 'Process & Methodology',
      steps: [
        {
          n: '01',
          t: 'Concept Development',
          b: 'Translated the emotional world of Inside Out 2 into a chocolate experience, using each emotion as a starting point for flavour, colour, form, and message.'
        },
        {
          n: '02',
          t: 'Behavioural Ritual',
          b: 'Designed a simple self-check-in loop: notice how you feel, choose a matching chocolate, read the message, and treat that emotion with kindness.'
        },
        {
          n: '03',
          t: 'Packaging System',
          b: 'Developed a wooden treasure box with layered compartments to create discovery, collectability, and a stronger sense of emotional interaction.'
        },
        {
          n: '04',
          t: 'Prototyping & Iteration',
          b: 'Modelled the box in Fusion 360, explored laser-cut construction, tested chocolate forms, and refined the poster based on feedback that the early version felt too explanatory.'
        },
        {
          n: '05',
          t: '3D Form Iteration (Fusion 360)',
          b: 'Explored multiple box configurations, moving from a single-layer structure to a multi-compartment treasure box. This shift improved interaction by introducing discovery and sequencing in the user experience.'
        },
        {
          n: '06',
          t: 'Material & Lighting Iteration (Blender)',
          b: 'Tested different chocolate textures and lighting setups to achieve realism and emotional tone. Adjusted roughness, colour variation, and light intensity to better reflect each emotional quality.'
        },
        {
          n: '07',
          t: 'Fabrication Iteration (Laser Cutting)',
          b: 'Refined structural details including hinge spacing, kerf tolerance, and material thickness. Adjustments improved assembly accuracy and usability of the final box.'
        }
      ],
      evidence: [
        {
          type: 'image',
          src: 'img_cho/blen.webp',
          format: 'landscape',
          caption: 'Material and lighting tests in Blender (texture, roughness, light balance)'
        },
        {
          type: 'image',
          src: 'img_cho/chofu.webp',
          format: 'landscape',
          caption: 'Model iterations in fusion'
        },
        {
          type: 'image',
          src: 'img_cho/fulas.webp',
          format: 'portrait',
          caption: 'Laser cutting iterations: kerf adjustment, hinge refinement, assembly testing'
        }
      ]
    },

    reflection: {
      sub: 'Learnings',
      body: `This project shifted my approach from designing a product to designing a behavioural experience. It also pushed me to learn intensive 3D production skills across Fusion 360 and Blender, from modelling the chocolate form and packaging structure to testing materials, lighting, and visual realism. I found it especially interesting to see how a digital 3D model could move into a physical chocolate-making process through moulding, prototyping, and fabrication. Although I am not fully satisfied with the final poster yet, the process helped me recognise that lighting and atmosphere in Blender are skills I want to keep improving when I have more time. Through this project, I learned that strong campaign design does not need to over-explain; it should create desire, clarity, and emotional pull through form, hierarchy, and story.`,

      pts: [
        'Packaging can become a ritual system, not just a container.',
        '3D modelling helped translate an emotional concept into a tangible product form.',
        'Fusion 360 and Blender became important tools for testing structure, material, lighting, and realism.',
        'The final poster could be stronger, especially through more refined Blender lighting and atmosphere.',
        'A campaign is stronger when the message is felt before it is explained.',
        'Feedback helped me reduce text and strengthen visual hierarchy.',
        'Speculative product design becomes more convincing when form, behaviour, fabrication, and story align.'
      ],

      evidence: [
        {
          type: 'image',
          src: 'img_cho/pro.webp',
          format: 'landscape',
          caption: 'From 3D Models to Real Chocolate',
        }
      ]
    }
  },


  'sparkling': {
    name: 'SantéLuximun Sparkling Water',
    type: 'Branding · Graphic Design',
    year: '2025',
    hc: ['#C8B99A', '#8C7B6B'],
    hl: 'Reframing Heritage',

    context: {
      sub: 'A Fresh Look of <br>SantéLuximun Sparkling Water',
      body: `This project responds to a commercial design brief for SantéLuximun Sparkling Water — a heritage brand seeking to expand into a younger market through a new sparkling product line.<br /><br />
My role was graphic designer responsible for developing three campaign visual concepts while working within fixed brand assets (existing logo and can design).`,
      meta: [
        { l: 'Role', v: 'Graphic Designer' },
        { l: 'Brief', v: 'Brand Campaign <br> Social Media Post' },
        { l: 'Constraint', v: 'Fixed logo + can assets' }
      ],
      evidence: [
        { type: 'image', src: 'img_sp/cover.webp' },
      ]
    },

    intent: {
      sub: 'The Challenge',
      body: `SantéLuximun carries a strong heritage identity — trusted, elegant, exclusive. But this same positioning risks alienating younger audiences who value freshness and social energy.<br /><br />
The brief involved competing stakeholder expectations: the marketing team wanted youthful appeal; the board wanted to preserve brand equity.`,
      quote: `"How might the brand feel more current and socially engaging without losing its sense of refinement?"`
    },

    moves: {
      sub: 'Process & Methodology',
      layout: 'flexible',
      steps: [
        {
          n: '01', t: 'Research',
          b: 'Analysed SantéLuximun\'s existing positioning and mapped the tension between luxury minimalism and youthful appeal.Identified what visual elements carry "heritage trust" vs "modern freshness".'
        },
        {
          n: '02', t: 'Direction Setting',
          b: 'Developed three distinct visual directions — Classic, Modern, and Balanced — as a way to test different brand tones without abandoning fixed assets. Each direction targets a different point on the heritage-freshness spectrum.'
        },
        {
          n: '03', t: 'Design',
          b: 'Applied composition, typography, hierarchy, and fruit imagery to each direction. Typography and layout do the heavy lifting — shifting tone without touching the logo or can design.'
        },
        {
          n: '04', t: 'Refine',
          b: 'Adjusted visual hierarchy, can arrangement, image integration, and type contrast so each direction felt intentional, readable, and aligned with its audience strategy.'
        }
      ],
      evidence: [
        { type: 'image', src: 'img_sp/class2.webp', caption: 'Classic direction' },
        { type: 'image', src: 'img_sp/class3.webp', caption: 'Classic direction' },
        { type: 'image', src: 'img_sp/class.webp', caption: 'Classic direction' },
        { type: 'image', src: 'img_sp/mo.webp', caption: 'Modern direction' },
        { type: 'image', src: 'img_sp/mo1.webp', caption: 'Modern direction' },
        { type: 'image', src: 'img_sp/mo2.webp', caption: 'Modern direction' },
        { type: 'image', src: 'img_sp/bal.webp', caption: 'Balanced direction' },
        { type: 'image', src: 'img_sp/bal1.webp', caption: 'Balanced direction' },
        { type: 'image', src: 'img_sp/bal2.webp', caption: 'Balanced direction' }
      ]
    },

    solution: {
      sub: 'Final Deliverables & Impact',
      body: `Three campaign visual concepts — Classic, Modern, and Balanced — each demonstrating how layout and typography alone can reposition a heritage brand. The project shows that visual language can create freshness without requiring identity change.`,
      metrics: [
        { n: '1', d: 'Visually-engaged with young audience' },
        { n: '2', d: 'Clearer brand repositioning' },
        { n: '3', d: 'Sustaining Elengance and Heritage values' }
      ],
      evidence: [
        { type: 'image', src: 'img_sp/sp_classic.webp', caption: 'Classic' },
        { type: 'image', src: 'img_sp/sp_balance.webp', caption: 'Balanced' },
        { type: 'image', src: 'img_sp/sp_modern.webp', caption: 'Modern' },
        { type: 'image', src: 'img_sp/sp_square.webp', caption: 'Social Media - Modern Direction' },]
    },

    reflection: {
      sub: 'Learnings',
      body: 'Working within strict constraints pushed me to think more carefully about visual hierarchy, composition, and tone — and taught me that balance is built through contrast, not neutrality.',
      pts: [
        'Design can reposition a brand without changing its core identity.',
        'Constraints sharpen creative decision-making rather than limiting it.',
        'Balance means deliberate choices about what to preserve and what to evolve.',
        'Design often mediates between competing stakeholder expectations — understanding that tension is part of the brief.'
      ]
    }
  },


  'i-see-you': {
    name: 'I SEE YOU',
    type: 'Interactive Coding · Generative Web Experience',
    year: '2024',
    hc: ['#7A9E7E', '#2C2825'],
    hl: 'An Interactive Meditation with Light, Motion, and Sound',

    context: {
      sub: 'Client & Scope',
      body: `I SEE YOU is an interactive creative coding project developed as part of a design programming course. The brief was to create a creative web-based experience that allows users to interact with visualisation through code.<br /><br />
Rather than designing a task-based interface, I created a contemplative digital space where users can pause, move their cursor, click, listen, and observe how their awareness visually affects a miniature universe around the body.<br /><br />
The project explores a simple emotional premise: our thoughts and emotions may seem invisible, but they shape how we experience ourselves, our relationships, and the world around us.`,
      meta: [
        { l: 'Role', v: 'Sole Designer<br>Creative Coder' },
        { l: 'Tool', v: 'p5.js' },
        { l: 'Format', v: 'Interactive Web Experience with Sound' },
        { l: 'Focus', v: 'Self-awareness<br>Generative Visualisation' }
      ],
      evidence: [
        { type: 'video', src: 'img_isu/overall-web.mp4', poster: 'img_isu/cover.webp', caption: 'Interactive visual meditation' },
      ]
    },

    solution: {
      sub: 'Final Solution',
      body: `The final outcome is a live interactive visual meditation built with p5.js, combining generative visuals, cursor-based interaction, mouse-triggered light effects, and ambient sound.<br />The embedded website allows viewers to experience the project directly inside the portfolio, while the full-screen link gives them a more immersive version with sound, space, and uninterrupted interaction.<br /><br />

  The sound layer is part of the experience, helping the interaction feel slower, softer, and more immersive. Together, the visual and audio elements create a small meditative space where users are invited to pause, observe, and reconnect with their inner world.<br /><br />

  Instead of asking users to label, track, or analyse their feelings directly, the website allows them to experience emotion as motion, light, rhythm, and spatial connection.<br />

  <div class="live-experience-block">
    <div class="live-experience-header">
      <div>
        <p class="live-kicker">Live Interactive Website</p>
        <h3>I SEE YOU — Visual Meditation Experience</h3>
      </div>

      <a class="project-live-link" href="https://gabscodie.github.io/iseeyou/" target="_blank" rel="noopener noreferrer">
        Open Full Experience ↗
      </a>
    </div>

    <div class="live-embed-shell" data-src="https://gabscodie.github.io/iseeyou/">
      <iframe 
        class="live-embed-frame"
        src="https://gabscodie.github.io/iseeyou/"
        title="I SEE YOU live interactive experience"
        loading="lazy"
        allow="autoplay; fullscreen"
        allowfullscreen>
      </iframe>

      <button class="live-embed-activate" type="button">
        <span>Enter Interactive Preview</span>
        <small>Click to activate movement, sound, and interaction</small>
      </button>

      <button class="live-embed-reset" type="button" aria-label="Close interactive preview">
        Close Preview ×
      </button>
    </div>

    <p class="live-note">
      The embedded version gives a direct preview inside the portfolio. Use Close Preview to reset the interaction and stop the sound.
    </p>
  </div><br />
    `,
      metrics: [
        { n: '1', d: 'Generative visual variations' },
        { n: '2', d: 'Mindfulness and Gratitude' },
        { n: '3', d: 'Calm and Relaxing Ambience' }
      ],
      evidence: []
    },

    intent: {
      sub: 'The Challenge',
      body: `People often move through life reacting, working, and coping without enough space to recognise what is happening inside them. Emotions and thoughts are easy to dismiss because they are invisible, yet they strongly influence our wellbeing, relationships, decisions, and sense of aliveness.<br /><br />
Many digital wellbeing tools use functional patterns such as tracking, streaks, reminders, and progress bars. While useful, these patterns can sometimes make reflection feel like another task to complete.<br /><br />
The concept reframes the screen as a small universe. The cursor becomes awareness. The body becomes an emotional centre. The galaxy responds to where attention is placed.`,
      quote: `"How might an interactive website create a gentle space for users to visualise their inner world, recognise their emotions, and reconnect with themselves through movement, light, sound, and generative code?"`,
      evidence: []
    },

    moves: {
      sub: 'Process & Methodology',
      steps: [
        {
          n: '01',
          t: 'Concept Framing',
          b: 'Started with the idea that every emotion and thought carries a message about wellbeing. I translated this into a visual metaphor where the user is positioned inside a miniature universe, surrounded by energy points that represent the connection between body, mind, and emotional awareness.'
        },
        {
          n: '02',
          t: 'Metaphor System',
          b: 'Defined the main symbolic elements: the Milky Way spiral represents the universe; the cursor represents awareness; the meditator represents the self; and seven coloured chakra lights represent different body zones and emotional centres — Mind, Eyes, Throat, Heart, Stomach, Back, and Legs.'
        },
        {
          n: '03',
          t: 'Interaction Design',
          b: 'Designed a minimal interaction model where users do not need buttons, menus, or instructions. Moving the cursor changes the direction of the galaxy, suggesting that awareness shapes perception. Clicking activates a random light response, suggesting that thoughts and emotions can appear unpredictably and affect different parts of the body.'
        },
        {
          n: '04',
          t: 'Creative Coding',
          b: 'Built the visual system in p5.js using rotating elliptical star paths, blinking stars, chakra particle systems, and sine/cosine motion. The galaxy is generated through hundreds of rotating paths, while the body and chakra systems are animated through particles, colour, velocity, and acceleration.'
        },
        {
          n: '05',
          t: 'Light Effect Development',
          b: 'Created three emotional light responses: Hugging, Spreading, and Connecting. Each effect uses motion to express a different emotional quality — being held, transforming outward, or forming a connection between awareness and the body.'
        },
        {
          n: '06',
          t: 'Sound Integration',
          b: 'Integrated ambient sound as part of the meditative atmosphere. The audio layer supports the visual rhythm of the galaxy and light effects, helping the experience feel slower, softer, and more immersive.'
        },
        {
          n: '07',
          t: 'Refinement',
          b: 'Refined the timing, particle density, colour temperature, sound atmosphere, and randomness of the visual effects so the experience felt spacious rather than overstimulating. Each run generates a slightly different message, allowing the interaction to feel personal, reflective, and alive.'
        }
      ],
      evidence: [
        {
          type: 'video',
          src: 'img_isu/reminder-web.mp4',
          caption: 'Each reload generates a unique message'
        },
        {
          type: 'video',
          src: 'img_isu/univ-web.mp4',
          caption: 'The universe moves with your mouse, as if you are guiding your inner world'
        }
      ]
    },

    reflection: {
      sub: 'Learnings',
      body: `This project helped me understand creative coding as more than a technical exercise. Code can become a soft, expressive, and emotionally intelligent medium when it is grounded in a clear conceptual system. Through I SEE YOU, I learned how interaction design can make abstract inner experiences feel visible without forcing users to explain them in words.

<br><br>

Technically, this project was also challenging because I had to figure out the logic behind drawing the human body, creating the explosion effect, and building the rotating universe spiral through code. These were not just visual effects; they became part of the emotional language of the experience. The more I refined the particles, movement, and body form, the more I understood how technical decisions could shape the feeling of softness, awareness, and inner connection.`,

      pts: [
        'Creative coding can support emotional reflection, not only visual experimentation.',
        'A strong metaphor system helps abstract concepts become understandable through interaction.',
        'Drawing the human body through code was challenging, but it helped me understand how form can carry emotional meaning.',
        'The explosion effect and rotating universe spiral taught me how motion logic can create atmosphere and feeling.',
        'Minimal interfaces can feel more immersive when the whole canvas becomes the experience.',
        'Sound can deepen the emotional atmosphere of an interactive visual system.',
        'Generative randomness can make a digital experience feel more personal and alive.',
        'Technical systems such as particles, motion, colour, and body logic become more meaningful when connected to human emotion.'
      ],

      evidence: [
        {
          type: 'video',
          src: 'img_isu/chakras-web.mp4',
          caption: 'The seven chakras act as symbolic energy points in the body. Each one responds to your attention, reminding you that caring for your inner world starts with noticing where your energy is held.'
        }
      ]
    }
  },

  //   'zine': {
  //     name: 'Notes on Being a Designer',
  //     type: 'Editorial Design · Publication Design',
  //     year: '2024',
  //     hc: ['#E9E9E9', '#B8C4B1'],
  //     hl: 'Design Theory, Lived',

  //     context: {
  //       sub: 'Client & Scope',
  //       body: `This editorial zine was developed across a 13-week design theory course. The task was to document and respond to weekly readings — but the approach was left open.<br /><br />
  // Rather than producing annotated notes, I chose to translate theory into a personal visual narrative in zine format. My role: sole designer and author.`,
  //       meta: [
  //         { l: 'Role', v: 'Designer · Author' },
  //         { l: 'Duration', v: '13 weeks' },
  //         { l: 'Format', v: 'Editorial Zine' }
  //       ],
  //       evidence: [
  //         { type: 'placeholder', label: 'Add cover image of the zine here' },
  //         // { type: 'image', src: 'img/zine_cover.webp', caption: 'Zine cover' },
  //       ]
  //     },

  //     intent: {
  //       sub: 'The Challenge',
  //       body: `Design theory is often taught as something to be absorbed and repeated. But the most valuable insights from theory come when you connect them to lived experience.<br /><br />
  // <strong>How might a publication communicate design theory through emotion, reflection, and storytelling — rather than explanation?</strong><br /><br />
  // The challenge was to make 13 weeks of content feel cohesive, personal, and worth reading.`,
  //       quote: `"Every moment of being human counts as design material."`,
  //       evidence: [
  //         { type: 'placeholder', label: 'Add early sketches, layout explorations, or content mapping here' },
  //       ]
  //     },

  //     moves: {
  //       sub: 'Process & Methodology',
  //       steps: [
  //         {
  //           n: '01', t: 'Research & Reading',
  //           b: 'Collected 13 weeks of theory, identifying recurring themes: Country, storytelling, graphic design history, and design as meaning-making. Looked for the emotional thread connecting them all.'
  //         },
  //         {
  //           n: '02', t: 'Narrative Framing',
  //           b: 'Reframed the content as a continuous personal story rather than a summary document. Decided early that the zine would be written in first person and include hand-drawn visual marks.'
  //         },
  //         {
  //           n: '03', t: 'Editorial Design',
  //           b: 'Designed layout, typography, and image placement to create a reflective reading pace. Used softness, negative space, and visual quietness to mirror the reflective tone of the writing.'
  //         },
  //         {
  //           n: '04', t: 'Refinement',
  //           b: 'Adjusted spread pacing and composition to ensure the zine felt coherent as both a theoretical and personal publication — not just a collection of weekly entries.'
  //         }
  //       ],
  //       evidence: [
  //         { type: 'placeholder', label: 'Add spread development, layout iterations, or drafts here' },
  //         // { type: 'image', src: 'img/zine_spread1.webp', caption: 'Spread — week 1–3' },
  //         // { type: 'image', src: 'img/zine_spread2.webp', caption: 'Spread — mid-zine development' },
  //       ]
  //     },

  //     solution: {
  //       sub: 'Deliverables & Impact',
  //       body: `A cohesive editorial zine presenting 13 weeks of design theory as an intimate personal narrative. The publication demonstrates how editorial design can hold intellectual complexity while remaining emotionally accessible.`,
  //       metrics: [
  //         { n: '13', d: 'Weeks synthesised' },
  //         { n: '01', d: 'Cohesive editorial narrative' },
  //         { n: '02', d: 'Theory made personal' }
  //       ],
  //       evidence: [
  //         { type: 'placeholder', label: 'Add final spread photography or scan of the finished zine here' },
  //         // { type: 'image', src: 'img/zine_spread3.webp', caption: 'Final spread — cover section' },
  //         // { type: 'image', src: 'img/zine_spread4.webp', caption: 'Final spread — closing section' },
  //         // { type: 'video', src: 'img/zine_flipthrough-web.mp4', caption: 'Zine flip-through' },
  //       ]
  //     },

  //     reflection: {
  //       sub: 'Learnings',
  //       body: 'This project taught me that design theory becomes more meaningful when interpreted through lived experience. I also learned that editorial design is itself a form of argument — how you arrange ideas shapes what they mean.',
  //       pts: [
  //         'Theory can be communicated through feeling, not only explanation.',
  //         'Editorial pacing shapes how ideas are absorbed — slower is sometimes more.',
  //         'Personal reflection can strengthen theoretical work by grounding abstract ideas.',
  //         'Visual storytelling helps theory become more accessible and memorable.'
  //       ]
  //     }
  //   }


};

function fallback(id) { return { name: id, type: 'Design', year: '2024', hc: ['#C8B99A', '#8C7B6B'], hl: 'Design Project', context: { sub: 'Coming Soon', body: 'Case study in progress.', meta: [{ l: 'Status', v: 'Coming Soon' }], evidence: [] }, intent: { sub: 'The Challenge', body: 'To be added.', quote: '', evidence: [] }, moves: { sub: 'Process', evidence: [], steps: [{ n: '01', t: 'Research', b: 'Coming soon.' }, { n: '02', t: 'Define', b: 'Coming soon.' }] }, solution: { sub: 'Deliverables', body: 'Coming soon.', metrics: [], evidence: [] }, reflection: { sub: 'Learnings', body: 'Coming soon.', pts: ['Coming soon.'] } }; }
function getProject(id) { return projects[id] || fallback(id); }

/* ── OPEN/CLOSE OVERLAY ── */
function openProject(id) {
  const p = getProject(id);
  const g = `linear-gradient(135deg,${p.hc[0]},${p.hc[1]})`;
  const g2 = `linear-gradient(135deg,${p.hc[1]},${p.hc[0]})`;

  document.getElementById('proj-sidebar-name').textContent = p.name;
  document.getElementById('proj-sidebar-type').textContent = p.type;
  document.getElementById('proj-year-sidebar').textContent = `Year: ${p.year}`;

  const tabList = document.querySelector('.proj-tab-list');

  tabList.innerHTML =
    `<li class="proj-tab active" data-section="context" onclick="scrollToSection('context',this)">Context</li>
     <li class="proj-tab" data-section="intent" onclick="scrollToSection('intent',this)">Intent</li>
     <li class="proj-tab" data-section="moves" onclick="scrollToSection('moves',this)">Moves</li>
     <li class="proj-tab" data-section="solution" onclick="scrollToSection('solution',this)">Solution</li>
     <li class="proj-tab" data-section="reflection" onclick="scrollToSection('reflection',this)">Reflection</li>`;

  const contextMeta = (p.context.meta || [])
    .map(m => `<div class="meta-item"><label>${m.l}</label><span>${m.v}</span></div>`)
    .join('');

  const steps = (p.moves.steps || [])
    .map(s => `<div class="step-item"><div class="step-num">${s.n}</div><div class="step-body"><h4>${s.t}</h4><p>${s.b}</p></div></div>`)
    .join('');

  const metrics = (p.solution.metrics || [])
    .map(m => `<div class="outcome-card"><div class="display outcome-num">${m.n}</div><p class="outcome-desc">${m.d}</p></div>`)
    .join('');

  const pts = (p.reflection.pts || [])
    .map(pt => `<div class="reflection-item"><p>${pt}</p></div>`)
    .join('');

  document.getElementById('proj-content').innerHTML = `
    <div class="proj-section" id="section-context">
      <p class="proj-section-label">Context</p>
      <h2 class="display proj-section-title">${p.context.sub}</h2>
      <div class="proj-meta-grid">${contextMeta}</div>
      ${buildFlexibleEvidenceGallery(p.context.evidence, g, 'Add project cover')}
      <p class="proj-body">${p.context.body}</p>
    </div>

    <div class="proj-section" id="section-intent">
      <p class="proj-section-label">Intent</p>
      <h2 class="display proj-section-title">The Challenge</h2>
      <p class="proj-body">${p.intent.body}</p>
      ${p.intent.quote ? `<blockquote class="proj-quote">${p.intent.quote}</blockquote>` : ''}
      ${buildFlexibleEvidenceGallery(p.intent.evidence, g, 'Add research evidence')}
    </div>

    <div class="proj-section" id="section-moves">
      <p class="proj-section-label">Moves</p>
      <h2 class="display proj-section-title">How it<br/>came to be</h2>
      ${buildFlexibleEvidenceGallery(p.moves.evidence, g, 'Process evidence')}
      <div class="proj-steps">${steps}</div>
    </div>

        <div class="proj-section" id="section-solution">
      <p class="proj-section-label">Solution</p>
      <h2 class="display proj-section-title">Final Design</h2>
      ${metrics ? `<div class="outcome-grid">${metrics}</div>` : ''}
      <p class="proj-body">${p.solution.body}</p>
      ${buildFlexibleEvidenceGallery(p.solution.evidence, g2, 'Add final designs')}
    </div>

    <div class="proj-section" id="section-reflection">
      <p class="proj-section-label">Reflection</p>
      <h2 class="display proj-section-title">What I learned</h2>
      <p class="proj-body">${p.reflection.body}</p>
      ${buildFlexibleEvidenceGallery(p.reflection.evidence, g2)}
      <div class="reflection-list">${pts}</div>
      </div>
  `;

  document.getElementById('proj-content').scrollTop = 0;

  document.querySelectorAll('.proj-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.proj-tab[data-section="context"]').classList.add('active');

  document.getElementById('project-overlay').classList.add('open');

  observeSections();
}

function closeProject() { document.getElementById('project-overlay').classList.remove('open'); }
function scrollToSection(id, el) { document.getElementById('section-' + id)?.scrollIntoView({ behavior: 'smooth' }); document.querySelectorAll('.proj-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); }
function observeSections() { const content = document.getElementById('proj-content'); const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { const id = e.target.id.replace('section-', ''); document.querySelectorAll('.proj-tab').forEach(t => t.classList.toggle('active', t.dataset.section === id)); } }); }, { root: content, threshold: .35 }); document.querySelectorAll('.proj-section').forEach(s => obs.observe(s)); }

/* ── FADE UP ── */
const fadeObs = new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }), { threshold: .08 });
document.querySelectorAll('.fade-up').forEach((el, i) => { el.style.transitionDelay = (i * 70) + 'ms'; fadeObs.observe(el); });

/* ── COPY EMAIL ── */
function copyEmail(btn) { navigator.clipboard.writeText('gabriella.hoangg@gmail.com').then(() => { btn.textContent = 'Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000); }); }

