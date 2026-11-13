import type { Thesis } from '../schema'

/*
 * The master's thesis overview (/en/about/thesis): a first draft in the case-study template.
 * Plain labels, no quotes or testimonials; the author is not named and the company is anonymous.
 *
 * Publishing internal survey figures and naming the employer needs the employer's consent. Keep
 * anonymous until then.
 */
export const thesis = {
  eyebrow: "Master's thesis · Hyper Island · 2024",
  title: 'LLMs for burnout prevention',
  subtitle:
    'A case study at a Swiss software company: how people see burnout prevention, and where a language model could help.',
  answer: {
    label: 'In one line',
    text: 'A conversational knowledge base with visible sources earned trust. Check-ins were liked but felt meant for others. LLMs help as a first step, not for intimate or medical topics.',
  },
  meta: [
    { label: 'Programme', value: 'MA Digital Management' },
    { label: 'Submitted', value: 'December 2024' },
    { label: 'Method', value: 'Mixed methods, explanatory sequential' },
    { label: 'Scope', value: '15,676 words, about 75 pages' },
    { label: 'Setting', value: 'A Swiss software company, about 220 people' },
  ],
  scoreboard: [
    { value: '46', label: 'Survey responses' },
    { value: '4', label: 'Interviews' },
    { value: '2', label: 'Prototype functions' },
    { value: '9', label: 'Test participants in 2 rounds' },
  ],
  chapters: {
    question: {
      label: 'The question',
      title: 'The question',
      lead: 'Stress and emotional exhaustion at work keep rising in Switzerland, and IT gets little research attention.',
      body: [
        'Reported workplace stress, emotional exhaustion and burnout risk in Switzerland rose from 17.5% in 2012 to 22.9% in 2022 (Swiss Health Survey). Healthcare, education and social work are well studied. IT is not. Language-model chatbots open a new way to support prevention.',
        'Two questions guided the work.',
      ],
      questions: [
        {
          label: 'Q1',
          text: 'What are the perceptions, practices and challenges related to burnout prevention in an organisation?',
        },
        { label: 'Q2', text: 'How can LLMs support and enhance burnout prevention in an organisation?' },
      ],
    },
    context: {
      label: 'Context',
      title: 'Context',
      lead: 'A full-service provider of web applications for public institutions that doubled in size in seven years.',
      body: [
        'Founded in 1977, about 220 employees, four divisions: HR, Digital Consulting, Software Development and IT Services.',
        "The literature review covered the disputed definition of burnout (from Freudenberger in 1974 to the WHO's occupational phenomenon of exhaustion, cynicism and inefficacy, measured with the Maslach Burnout Inventory), person-led versus organisation-led prevention, burnout in IT, Swiss culture, ethics, and how LLMs and chatbots work, including trust, familiarity and limits such as hallucinations, opacity and data privacy.",
      ],
    },
    approach: {
      label: 'Approach',
      title: 'Approach',
      lead: 'Survey first, then interviews, then a prototype, tested twice.',
      body: [
        'A case study with mixed methods in an explanatory sequential design: each step explains the one before. The prototype phase used a shortened Google Ventures design sprint: map, sketch, decide, prototype, test.',
      ],
    },
    survey: {
      label: 'Survey',
      title: 'What the survey showed',
      lead: 'Half of the respondents had felt at risk, and almost nobody went to HR.',
      body: [
        '46 people answered over four weeks, aged 23 to 62. Their understanding of burnout matched the literature. 7 had experienced burnout and 24 (52%) had felt or feel at risk, well above the national figure of 25%. Of the 24 at risk, only 8 talked to their manager and none contacted HR. Only 6 knew any prevention measures.',
        '32 felt the work environment at least sometimes contributes, mainly through too few people for the projects and deadlines, customer satisfaction ranked above wellbeing, and little leadership training on workload and mental health.',
        'On LLMs: 18 use them regularly and 27 are excited about them, but only 8 trust generated content. 27 would feel comfortable discussing burnout with an LLM and 12 would not, citing an impersonal feel, doubts about language understanding and data privacy.',
      ],
    },
    insights: {
      label: 'Key insights',
      title: 'Key insights',
      lead: 'Prevention is culture, and everyone has a role in it.',
      cards: [
        {
          title: 'Culture first',
          body: 'Psychological safety is the core of prevention. Values and management principles existed on paper but were never rolled out.',
        },
        {
          title: 'Roles',
          body: 'Individuals take self-responsibility, managers act as role models and notice changes, HR builds awareness and coaches managers.',
        },
        {
          title: 'Silence',
          body: 'Stigma keeps people quiet, and strong specialists are often promoted into management without people skills.',
        },
        {
          title: 'Limits',
          body: 'Sending people home can backfire, healthy boundaries work better. An LLM cannot read body language, and no single assessment fits everyone.',
        },
      ],
      body: [
        'Four one-hour interviews (two HR, two people managers). With an HR expert, the burnout process was mapped. The only data signal, rising single-day sick leave, appears late.',
      ],
    },
    prototype: {
      label: 'Prototype',
      title: 'The prototype',
      lead: 'Two functions, built around a familiar chat layout to earn trust.',
      body: [
        'A stakeholder map put the tool at the centre.',
        'Function one is a conversational knowledge base using retrieval-augmented generation: first-level answers with visible sources and a handover to HR for anything detailed. Function two is a monthly five-minute check-in chatbot that maps answers to the Maslach Burnout Inventory in the background.',
        'Built as a Figma prototype with two custom GPTs (GPT-4o) in a ChatGPT-like dark layout.',
      ],
    },
    testing: {
      label: 'Testing',
      title: 'Testing',
      lead: 'Sources build trust, and tone matters as much as features.',
      body: [
        'Round one, five people (three individual contributors, a manager, an HR employee), think-aloud plus debrief. Navigation was easy. 2 of 5 did not understand the knowledge base and 4 of 5 missed the source citations, and noticing them raised trust. The custom GPT broke its instructions after two answers and started to diagnose. 4 of 5 still welcomed conversational answers and asked to connect the company wiki and document store.',
        'The check-in confused people (1 of 5 understood it, 1 of 5 would use it), but 4 of 5 liked its brief, empathetic tone. 2 of 5 were put off by the German "ß", which is not used in Switzerland.',
        'Round two, four new people: clearer source labels, and everyone trusted the answers. New concerns: outdated wiki pages, customer data in the wiki and the effort for HR to keep content current.',
      ],
    },
    conclusions: {
      label: 'Conclusions',
      title: 'Conclusions and reflection',
      lead: 'Real but modest potential, as long as people stay in charge.',
      body: [],
      answers: [
        {
          label: 'Q1',
          body: 'The disputed definition of burnout hurts everyone. Private life matters as much as work. Prevention needs personal responsibility, good role models and a culture that puts wellbeing first, even if that means saying no to a client project. Promote people with interpersonal skills into management.',
        },
        {
          label: 'Q2',
          body: 'The conversational knowledge base got the most approval, and transparent sources build trust. Check-ins were liked for their tone, but people saw the benefit for others rather than themselves. Because of hallucinations and opacity, LLMs should not yet handle intimate or medical topics. Later, small continuous MBI-style check-ins could replace one-off surveys led by experts.',
        },
      ],
      nextLabel: 'Next steps',
      next: [
        'Occupational health management',
        'A multi-layer prevention study for IT companies',
        'Conversational handling of forms, surveys and assessments',
      ],
      reflectionLabel: 'Reflection on the method',
      reflection:
        "A compressed design sprint is stressful and does not suit complex problems. A meeting room does not recreate real pressure. Hofstede's dimensions are too static for a multicultural, multilingual team. Asking for job level weakened anonymity, and anonymity matters more than extra insight. Survey and interviews carry self-selection bias. AI tools (Grammarly, ChatGPT as a critical sparring partner, Consensus for literature search) helped, and their output was checked, not relied on.",
    },
  },
  slots: {
    knowledgeBase: 'Prototype screenshot: knowledge base',
    checkIn: 'Prototype screenshot: check-in',
    sources: 'Prototype screenshot: source labels, iteration 2',
  },
  drawings: {
    sequence: {
      title: 'Explanatory sequential design',
      description:
        'Five steps in order, each explaining the one before: a survey, interviews, a prototype, a first test and a second test.',
      labels: {
        survey: 'Survey',
        interviews: 'Interviews',
        prototype: 'Prototype',
        test1: 'Test 1',
        test2: 'Test 2',
        explains: 'Each step explains the one before',
      },
    },
    burnout: {
      title: 'The burnout process and its data gap',
      description:
        'Causes lead to first symptoms, then to more single-day sick leave, the only data signal, then the manager seeks dialogue, then HR, then an intervention. Before the signal there is no data.',
      labels: {
        causes: 'Causes',
        symptoms: 'First symptoms',
        signal: 'More single-day sick leave',
        dialogue: 'Manager seeks dialogue',
        hr: 'Manager seeks HR',
        intervention: 'Intervention',
        gap: 'No data',
        only: 'The only data signal',
      },
    },
    stakeholders: {
      title: 'Stakeholder map',
      description: 'The tool at the centre, with individuals, managers, HR and leadership around it.',
      labels: {
        tool: 'The tool',
        individuals: 'Individuals',
        managers: 'Managers',
        hr: 'HR',
        leadership: 'Leadership',
      },
    },
    functions: {
      title: 'The two prototype functions',
      description:
        'A knowledge base that answers with sources and hands over to HR, and a monthly check-in whose answers map to the three dimensions of the Maslach Burnout Inventory.',
      labels: {
        knowledge: 'Knowledge base',
        sources: 'Answers with sources',
        handover: 'Handover to HR',
        checkIn: 'Check-in',
        monthly: 'Monthly, 5 minutes',
        mbi: 'Mapped to the MBI',
        exhaustion: 'Exhaustion',
        cynicism: 'Cynicism',
        inefficacy: 'Inefficacy',
      },
    },
    tests: {
      title: 'Two test iterations',
      description:
        'Round one with five people, round two with four new people. Between them the source labels became clearer.',
      labels: {
        round1: 'Round 1',
        round2: 'Round 2',
        people1: '5 people',
        people2: '4 new people',
        changed: 'Clearer source labels',
        found1: 'Sources missed',
        found2: 'Answers trusted',
      },
    },
  },
  back: 'Back to About',
} satisfies Thesis
