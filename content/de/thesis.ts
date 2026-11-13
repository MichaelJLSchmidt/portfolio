import type { Thesis } from '../schema'

/*
 * Die Übersicht der Masterarbeit (/de/about/thesis): ein erster Entwurf in der Vorlage der
 * Fallstudien. Schlichte Beschriftungen, keine Zitate oder Testimonials, die Autorschaft wird
 * nicht genannt, das Unternehmen bleibt anonym. Schweizer Hochdeutsch: "ss", keine Gedankenstriche
 * oder Semikolons (das Eszett ist darum ausgeschrieben).
 *
 * Publishing internal survey figures and naming the employer needs the employer's consent. Keep
 * anonymous until then.
 */
export const thesis = {
  eyebrow: 'Masterarbeit · Hyper Island · 2024',
  title: 'LLMs für Burnout-Prävention',
  subtitle:
    'Eine Fallstudie in einem Schweizer Softwareunternehmen: wie Mitarbeitende Burnout-Prävention sehen und wo ein Sprachmodell helfen kann.',
  answer: {
    label: 'In einem Satz',
    text: 'Eine dialogische Wissensbasis mit sichtbaren Quellen schafft Vertrauen. Check-ins kamen gut an, wirkten aber eher für andere gedacht. LLMs helfen als erster Schritt, nicht bei intimen oder medizinischen Themen.',
  },
  meta: [
    { label: 'Studiengang', value: 'MA Digital Management' },
    { label: 'Abgabe', value: 'Dezember 2024' },
    { label: 'Methode', value: 'Mixed Methods, explanatives sequenzielles Design' },
    { label: 'Umfang', value: "15'676 Wörter, rund 75 Seiten" },
    { label: 'Umfeld', value: 'Ein Schweizer Softwareunternehmen, rund 220 Mitarbeitende' },
  ],
  scoreboard: [
    { value: '46', label: 'Antworten in der Umfrage' },
    { value: '4', label: 'Interviews' },
    { value: '2', label: 'Prototyp-Funktionen' },
    { value: '9', label: 'Testpersonen in 2 Runden' },
  ],
  chapters: {
    question: {
      label: 'Die Frage',
      title: 'Die Frage',
      lead: 'Stress und emotionale Erschöpfung am Arbeitsplatz nehmen in der Schweiz zu, und die IT ist kaum erforscht.',
      body: [
        'Der Anteil Erwerbstätiger mit Stress, emotionaler Erschöpfung und Burnout-Risiko stieg in der Schweiz von 17,5 % im Jahr 2012 auf 22,9 % im Jahr 2022 (Schweizerische Gesundheitsbefragung). Gesundheitswesen, Bildung und Sozialarbeit sind gut untersucht, die IT nicht. Chatbots mit Sprachmodellen eröffnen neue Wege für die Prävention.',
        'Zwei Fragen leiteten die Arbeit.',
      ],
      questions: [
        {
          label: 'F1',
          text: 'Wie wird Burnout-Prävention in einer Organisation wahrgenommen, gelebt und erschwert?',
        },
        { label: 'F2', text: 'Wie können LLMs die Burnout-Prävention in einer Organisation unterstützen und stärken?' },
      ],
    },
    context: {
      label: 'Kontext',
      title: 'Kontext',
      lead: 'Ein Full-Service-Anbieter von Webanwendungen für öffentliche Institutionen, der in sieben Jahren doppelt so gross wurde.',
      body: [
        'Gegründet 1977, rund 220 Mitarbeitende, vier Bereiche: HR, Digital Consulting, Softwareentwicklung und IT Services.',
        'Die Literaturrecherche umfasste die umstrittene Definition von Burnout (von Freudenberger 1974 bis zum arbeitsbezogenen Phänomen der WHO mit Erschöpfung, Zynismus und verminderter Leistungsfähigkeit, gemessen mit dem Maslach Burnout Inventory), personen- und organisationsbezogene Prävention, Burnout in der IT, Schweizer Kultur, Ethik sowie die Funktionsweise von LLMs und Chatbots mit Vertrauen, Vertrautheit und Grenzen wie Halluzinationen, fehlender Transparenz und Datenschutz.',
      ],
    },
    approach: {
      label: 'Vorgehen',
      title: 'Vorgehen',
      lead: 'Zuerst eine Umfrage, dann Interviews, dann ein Prototyp mit zwei Testrunden.',
      body: [
        'Eine Fallstudie mit Mixed Methods im explanativen sequenziellen Design: Jeder Schritt erklärt den vorherigen. Für den Prototyp diente ein verkürzter Design Sprint nach Google Ventures: Map, Sketch, Decide, Prototype, Test.',
      ],
    },
    survey: {
      label: 'Umfrage',
      title: 'Was die Umfrage zeigt',
      lead: 'Die Hälfte fühlte sich gefährdet, fast niemand ging zur HR.',
      body: [
        '46 Personen zwischen 23 und 62 Jahren antworteten innert vier Wochen. Ihr Verständnis von Burnout deckt sich mit der Literatur. 7 hatten ein Burnout erlebt und 24 (52 %) fühlten oder fühlen sich gefährdet, deutlich über dem Schweizer Wert von 25 %. Von den 24 Gefährdeten sprachen nur 8 mit ihrer vorgesetzten Person und niemand mit der HR. Nur 6 kannten Präventionsmassnahmen.',
        '32 sehen das Arbeitsumfeld zumindest manchmal als Mitursache, vor allem wegen zu wenig Personal für Projekte und Termine, Kundenzufriedenheit vor Wohlbefinden und wenig Führungsschulung zu Arbeitslast und psychischer Gesundheit.',
        'Zu LLMs: 18 nutzen sie regelmässig und 27 sind begeistert, aber nur 8 vertrauen generierten Inhalten. 27 würden mit einem LLM über Burnout sprechen, 12 nicht. Genannt wurden ein unpersönlicher Eindruck, Zweifel am Sprachverständnis und Datenschutz.',
      ],
    },
    insights: {
      label: 'Erkenntnisse',
      title: 'Zentrale Erkenntnisse',
      lead: 'Prävention ist Kultur, und alle haben eine Rolle darin.',
      cards: [
        {
          title: 'Kultur zuerst',
          body: 'Psychologische Sicherheit ist der Kern der Prävention. Werte und Führungsgrundsätze gab es auf Papier, eingeführt wurden sie nie.',
        },
        {
          title: 'Rollen',
          body: 'Einzelne übernehmen Selbstverantwortung, Führungspersonen sind Vorbilder und bemerken Veränderungen, die HR schafft Bewusstsein und coacht Führungspersonen.',
        },
        {
          title: 'Schweigen',
          body: 'Stigma hält Menschen still, und starke Fachleute werden oft ohne Führungskompetenz befördert.',
        },
        {
          title: 'Grenzen',
          body: 'Leute nach Hause schicken kann nach hinten losgehen, gesunde Grenzen wirken besser. Ein LLM liest keine Körpersprache, und keine einzelne Erhebung passt für alle.',
        },
      ],
      body: [
        'Vier einstündige Interviews (zwei HR, zwei Führungspersonen). Mit einer HR-Fachperson wurde der Burnout-Prozess kartiert. Das einzige Datensignal, mehr eintägige Absenzen, zeigt sich spät.',
      ],
    },
    prototype: {
      label: 'Prototyp',
      title: 'Der Prototyp',
      lead: 'Zwei Funktionen in einem vertrauten Chat-Layout, damit Vertrauen entsteht.',
      body: [
        'Eine Stakeholder-Map stellte das Tool ins Zentrum.',
        'Funktion eins ist eine dialogische Wissensbasis mit Retrieval-Augmented Generation: erste Antworten mit sichtbaren Quellen und Übergabe an die HR, sobald es konkret wird. Funktion zwei ist ein monatlicher Check-in-Chatbot von fünf Minuten, der die Antworten im Hintergrund dem Maslach Burnout Inventory zuordnet.',
        'Umgesetzt als Figma-Prototyp mit zwei Custom GPTs (GPT-4o) in einem dunklen Layout nach dem Vorbild von ChatGPT.',
      ],
    },
    testing: {
      label: 'Tests',
      title: 'Tests',
      lead: 'Quellen schaffen Vertrauen, und der Ton zählt so viel wie die Funktion.',
      body: [
        'Runde eins mit fünf Personen (drei Fachpersonen, eine Führungsperson, eine Person aus der HR), lautes Denken und Nachgespräch. Die Navigation war einfach. 2 von 5 verstanden die Wissensbasis nicht und 4 von 5 übersahen die Quellenangaben. Wer sie bemerkte, vertraute mehr. Das Custom GPT brach nach zwei Antworten seine Vorgaben und begann zu diagnostizieren. Trotzdem wünschten sich 4 von 5 dialogische Antworten und die Anbindung von Firmenwiki und Dokumentablage.',
        'Der Check-in verwirrte (1 von 5 verstand ihn, 1 von 5 würde ihn nutzen), doch 4 von 5 mochten den kurzen, empathischen Ton. 2 von 5 störten sich am Eszett, das in der Schweiz nicht verwendet wird.',
        'Runde zwei mit vier neuen Personen: Mit klareren Quellenhinweisen vertrauten alle den Antworten. Neue Bedenken waren veraltete Wikiseiten, Kundendaten im Wiki und der Aufwand für die HR, Inhalte aktuell zu halten.',
      ],
    },
    conclusions: {
      label: 'Fazit',
      title: 'Fazit und Reflexion',
      lead: 'Echtes, aber bescheidenes Potenzial, solange Menschen die Verantwortung behalten.',
      body: [],
      answers: [
        {
          label: 'F1',
          body: 'Die umstrittene Definition von Burnout schadet allen. Das Privatleben zählt so viel wie die Arbeit. Prävention braucht Selbstverantwortung, gute Vorbilder und eine Kultur, die Wohlbefinden an erste Stelle setzt, auch wenn das ein Nein zu einem Kundenprojekt bedeutet. In Führungsrollen gehören Menschen mit sozialer Kompetenz.',
        },
        {
          label: 'F2',
          body: 'Die dialogische Wissensbasis fand am meisten Zustimmung, und transparente Quellen schaffen Vertrauen. Check-ins gefielen wegen des Tons, der Nutzen wurde aber eher bei anderen gesehen. Wegen Halluzinationen und fehlender Transparenz sollten LLMs intime oder medizinische Themen noch nicht übernehmen. Künftig könnten kleine, laufende Check-ins nach MBI einmalige Erhebungen durch Fachleute ersetzen.',
        },
      ],
      nextLabel: 'Nächste Schritte',
      next: [
        'Betriebliches Gesundheitsmanagement',
        'Eine mehrschichtige Präventionsstudie für IT-Firmen',
        'Dialogische Formulare, Umfragen und Erhebungen',
      ],
      reflectionLabel: 'Reflexion zur Methode',
      reflection:
        'Ein verkürzter Design Sprint ist stressig und passt nicht zu komplexen Problemen. Ein Sitzungszimmer bildet echten Druck nicht nach. Hofstedes Dimensionen sind für ein multikulturelles, mehrsprachiges Team zu statisch. Die Frage nach der Hierarchiestufe schwächte die Anonymität, und Anonymität ist wichtiger als zusätzliche Erkenntnisse. Umfrage und Interviews sind von Selbstselektion geprägt. KI-Werkzeuge (Grammarly, ChatGPT als kritisches Gegenüber, Consensus für die Literatursuche) halfen, ihre Ergebnisse wurden geprüft und nicht blind übernommen.',
    },
  },
  slots: {
    knowledgeBase: 'Screenshot des Prototyps: Wissensbasis',
    checkIn: 'Screenshot des Prototyps: Check-in',
    sources: 'Screenshot des Prototyps: Quellenhinweise, Runde 2',
  },
  drawings: {
    sequence: {
      title: 'Explanatives sequenzielles Design',
      description:
        'Fünf Schritte nacheinander, jeder erklärt den vorherigen: eine Umfrage, Interviews, ein Prototyp, ein erster und ein zweiter Test.',
      labels: {
        survey: 'Umfrage',
        interviews: 'Interviews',
        prototype: 'Prototyp',
        test1: 'Test 1',
        test2: 'Test 2',
        explains: 'Jeder Schritt erklärt den vorherigen',
      },
    },
    burnout: {
      title: 'Der Burnout-Prozess und seine Datenlücke',
      description:
        'Ursachen führen zu ersten Symptomen, dann zu mehr eintägigen Absenzen, dem einzigen Datensignal, dann sucht die Führungsperson das Gespräch, dann die HR, dann folgt eine Intervention. Vor dem Signal gibt es keine Daten.',
      labels: {
        causes: 'Ursachen',
        symptoms: 'Erste Symptome',
        signal: 'Mehr eintägige Absenzen',
        dialogue: 'Führung sucht das Gespräch',
        hr: 'Führung sucht die HR',
        intervention: 'Intervention',
        gap: 'Keine Daten',
        only: 'Das einzige Datensignal',
      },
    },
    stakeholders: {
      title: 'Stakeholder-Map',
      description: 'Das Tool im Zentrum, darum herum Einzelne, Führungspersonen, die HR und die Geschäftsleitung.',
      labels: {
        tool: 'Das Tool',
        individuals: 'Einzelne',
        managers: 'Führungspersonen',
        hr: 'HR',
        leadership: 'Geschäftsleitung',
      },
    },
    functions: {
      title: 'Die zwei Funktionen des Prototyps',
      description:
        'Eine Wissensbasis, die mit Quellen antwortet und an die HR übergibt, und ein monatlicher Check-in, dessen Antworten den drei Dimensionen des Maslach Burnout Inventory zugeordnet werden.',
      labels: {
        knowledge: 'Wissensbasis',
        sources: 'Antworten mit Quellen',
        handover: 'Übergabe an die HR',
        checkIn: 'Check-in',
        monthly: 'Monatlich, 5 Minuten',
        mbi: 'Zuordnung zum MBI',
        exhaustion: 'Erschöpfung',
        cynicism: 'Zynismus',
        inefficacy: 'Leistung',
      },
    },
    tests: {
      title: 'Zwei Testrunden',
      description:
        'Runde eins mit fünf Personen, Runde zwei mit vier neuen Personen. Dazwischen wurden die Quellenhinweise klarer.',
      labels: {
        round1: 'Runde 1',
        round2: 'Runde 2',
        people1: '5 Personen',
        people2: '4 neue Personen',
        changed: 'Klarere Quellenhinweise',
        found1: 'Quellen übersehen',
        found2: 'Antworten vertraut',
      },
    },
  },
  back: 'Zurück zu Über mich',
} satisfies Thesis
