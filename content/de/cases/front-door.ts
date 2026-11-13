/* Case 03: Ein Umzug, eine Meldung (front-door, grove). Server-only page text. */
import type { CaseStudy } from '../../schema'

export const frontDoor: CaseStudy = {
  slug: 'front-door',
  number: '03',
  identity: 'grove',
  label: 'Service',
  title: 'Ein Umzug, eine Meldung',
  statement: 'Einmal melden. Wir informieren die anderen vier.',
  heroImage: 'front-door-hero',
  summary:
    'Wer innerhalb des Kantons umzog, musste bis zu fünf Ämtern dasselbe mitteilen, oft auf Papier und am Schalter. Wir haben einen Onlinedienst gestaltet, der alle auf einmal informiert. Heute schliessen 83% der Menschen, die ihn beginnen, ihn auch ab, und die Anrufe zu Umzügen sind um fast ein Drittel zurückgegangen.',
  meta: {
    client: 'Ein kantonales Einwohnerregister, 27 Gemeinden und eine kantonale Steuerverwaltung',
    timeframe: '2023–2025',
    role: 'Lead Service Designer und UX-Leitung des Umsetzungsteams',
    team: '3 Personen aus meinem Team, 6 Personen in der Entwicklung, ein Product Owner des Kantons, eine Ansprechperson pro Gemeinde',
    type: 'Service Design für die Verwaltung · Umsetzung über Organisationen hinweg',
  },
  metrics: [
    { value: '54% → 83%', label: 'Abschlussquote online' },
    { value: '−31%', label: 'telefonische Anfragen zu Umzügen' },
    { value: '72%', label: 'der Umzüge am selben Tag bearbeitet (vorher: 6,5 Tage im Schnitt)' },
    { value: '27 von 27', label: 'Gemeinden live (Pilot: 4)' },
    { value: '62 → 81', label: 'Wert auf der System Usability Scale' },
  ],
  sections: {
    context: {
      label: 'Kontext',
      title: 'Fünf Ämter, ein Umzug',
      image: 'front-door-process',
      caption: 'Blueprint-Workshop mit Register, Gemeinden und Steuerverwaltung',
      body: [
        'Wer umzog, musste sich in der alten Gemeinde ab- und in der neuen anmelden und die Adresse für die Steuern, die Fahrzeugzulassung und teils für Sozialleistungen ändern. Es gab ein älteres Onlineformular, doch es erreichte nur die neue Gemeinde. Mehr als die Hälfte der Menschen, die es begannen, gaben auf, und das Personal am Schalter tippte die Daten von Hand ab.',
      ],
      note: '1200 Supportanfragen ausgewertet. Die häufigste Frage war: «Muss ich das auch dem Steueramt melden?»',
    },
    problem: {
      label: 'Problem',
      title: 'Niemandem gehörte «Umziehen».',
      illustration: 'JourneyEmotionCurve',
      body: [
        'Niemandem gehörte «Umziehen». Das Register verantwortete die Daten, jede Gemeinde ihren Schalter, die Steuerverwaltung ihre Akten. Jede Stelle mit eigener Rechtsgrundlage, eigenem Budget und eigenem IT-Lieferanten. Das Designproblem drehte sich ebenso um Einigung wie um Screens.',
      ],
    },
    role: {
      label: 'Meine Rolle',
      title: 'Was ich verantwortet habe und was nicht',
      body: ['Ich leitete das Service Design und die UX-Arbeit des Umsetzungsteams, über fünf Organisationen hinweg.'],
      owned: [
        'Research und Service Blueprint',
        'Moderation von Workshops über Organisationen hinweg',
        'Interaction Design und Prototypen',
        'Feedbackschleife beim Rollout',
      ],
      notOwned: ['Rechtliche Vereinbarungen', 'Backend-Integrationen', 'Personalentscheide der Gemeinden'],
    },
    approach: {
      label: 'Vorgehen',
      title: 'Die Einigung gestalten, nicht nur die Screens',
      illustration: 'ServiceBlueprint',
      body: [],
      steps: [
        {
          title: 'Vom Küchentisch aus sehen',
          body: '18 Kontextinterviews mit Menschen, die gerade umgezogen waren, drei Tage Begleitung an Gemeindeschaltern und eine Auswertung von 1200 Supportanfragen.',
        },
        {
          title: 'Den ganzen Service zeichnen',
          body: 'Ein Service Blueprint über fünf Organisationen, in zwei Workshops mit 26 Teilnehmenden erstellt, machte die doppelte Datenerfassung für alle im Raum sichtbar.',
        },
        {
          title: 'Die Einigung prototypen, nicht nur das UI',
          body: 'Wir prototypten die Datenübergabe zwischen Register und Gemeinden als klickbaren Ablauf, damit der Rechtsdienst und die IT-Leitungen sie gemeinsam prüfen konnten.',
        },
        {
          title: 'Klein pilotieren, in Kohorten ausrollen',
          body: 'Zuerst vier Gemeinden, dann drei Kohorten über neun Monate, mit einem wöchentlichen Feedback-Call.',
        },
      ],
    },
    decisions: {
      label: 'Entscheide',
      title: 'Vier Entscheide und ihr Preis',
      body: [],
      items: [
        {
          decision: 'Jede Frage nur einmal',
          chose:
            'Ich habe entschieden, jede Angabe nur einmal abzufragen und weiterzuleiten, statt das Formular jedes Amts nachzubilden.',
          tradeOff:
            'Es brauchte eine neue Datenvereinbarung zwischen Register und Steuerverwaltung und kostete vier Monate.',
          why: 'Doppelte Fragen waren der Hauptgrund, warum Menschen aufgaben.',
        },
        {
          decision: 'Den Schalter behalten',
          chose:
            'Ich habe einen Dienst gewählt, den das Schalterpersonal für Menschen nutzt, die persönlich vorbeikommen.',
          tradeOff: 'Zusätzliche Rollen, Berechtigungen und Tests.',
          why: 'Die Gemeinden vertrauten einem Werkzeug, das ihr eigenes Personal nutzte, und es dient Menschen, die nicht online gehen können oder wollen.',
        },
        {
          decision: 'Einfache Sprache am Screen, Rechtliches bei Bedarf',
          chose: 'Ich habe Fragen in einfacher Sprache gewählt, mit den Rechtsgrundlagen in aufklappbaren Hinweisen.',
          tradeOff: 'Eine lange Verhandlung und zwei Prüfrunden mit dem Rechtsdienst.',
          why: 'Im Test stieg die Abschlussquote mit der einfachen Sprache von 61% auf 84%.',
        },
        {
          decision: 'Mit den Skeptischen pilotieren',
          chose: 'Ich habe die zwei kritischsten Gemeinden in den Pilot aufgenommen.',
          tradeOff: 'Ein langsamerer Pilot und schwierigere Gespräche.',
          why: 'Sobald sie dabei waren, folgten die anderen ohne Eskalation.',
        },
      ],
    },
    artefacts: {
      label: 'Artefakte',
      title: 'Was unterwegs entstanden ist',
      body: [],
      items: [
        {
          title: 'Fragen in einfacher Sprache',
          caption: 'Jede Frage am Screen in einfacher Sprache, die Rechtsgrundlage nur einen Tipp entfernt.',
        },
        {
          title: 'Prototyp der Datenübergabe',
          caption:
            'Ein klickbarer Ablauf der Übergabe zwischen Register und Gemeinden, gemeinsam vom Rechtsdienst und den IT-Leitungen geprüft.',
        },
        {
          title: 'Rollout in Kohorten',
          caption: 'Vier Pilotgemeinden, dann drei Kohorten über neun Monate, mit einem wöchentlichen Feedback-Call.',
        },
      ],
    },
    outcomes: {
      label: 'Ergebnisse',
      title: 'Was sich verändert hat',
      body: [
        'Alle 27 Gemeinden sind live. Die Abschlussquote online stieg von 54% auf 83%, telefonische Anfragen zu Umzügen sanken um 31%, und 72% der Umzüge werden heute am selben Tag bearbeitet statt nach durchschnittlich sechseinhalb Tagen. Das Schalterpersonal tippt keine Daten mehr ab, und der SUS-Wert stieg von 62 auf 81.',
      ],
    },
    differently: {
      label: 'Was ich anders machen würde',
      title: 'Was ich anders machen würde',
      body: [
        'Wir haben mit zu wenigen Menschen getestet, die selten und unter Druck umziehen: ältere Menschen, Menschen in Trennung, Menschen mit einer Beistandschaft. Sie zeigten sich spät, erst während des Rollouts, und erzwangen eine Überarbeitung des Schritts «Wer zieht mit dir um?». Nächstes Mal würde ich ab der ersten Runde nach Lebenssituationen rekrutieren, nicht nach Demografie. Und ich würde den Feedbackkanal für das Schalterpersonal am ersten Tag des Pilots öffnen, nicht in der sechsten Woche.',
      ],
    },
    next: { label: 'Weiter', title: 'Nächstes Projekt', card: 'team-of-teams' },
  },
}
