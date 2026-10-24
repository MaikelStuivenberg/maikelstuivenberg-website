export const nl = {
  langLabel: "NL",
  langOther: "EN",
  programme: "Geloven in de Buurt",
  programmeSub: "Leger des Heils",
  campaignTagline: "Breng Jezus in jouw buurt",

  attractQuestions: [
    "Breng Jezus in jouw buurt.",
    "Je hoeft niet ver te gaan. Begin in je eigen buurt.",
    "Wat doe jij na vandaag?",
    "Missie begint om de hoek.",
    "Geloven in de Buurt: de eerste stap in je eigen straat.",
  ],
  attractCta: "Tik om te starten",
  attractPlacesCount: "{count} plekken in heel Nederland",

  chooseTitle: "Waar zet jij de eerste stap?",
  chooseAll: "Laat alle plekken zien",
  chooseAllHint: "Kaart van heel Nederland",
  chooseNear: "Zoek in jouw buurt",
  chooseNearHint: "Op basis van je woonplaats",

  searchTitle: "Waar woon je?",
  searchPlaceholder: "Postcode of woonplaats",
  spaceKeyLabel: "spatie",
  searchGo: "Zoek",
  searchSending: "Zoeken…",
  searchBack: "Terug",
  searchEmptyHint: "Typ een postcode of plaats en tik op Zoek.",
  searchError: "Niet gevonden. Probeer een postcode of plaats.",

  mapAllTitle: "Plekken in Nederland",
  mapNearTitle: "In jouw buurt",
  mapBack: "Terug",
  mapHelp: "Kom in actie in je buurt",
  placeJoinHere: "Hier kun je meedoen",
  mapDistance: "km",
  mapNoResults: "Geen plekken gevonden in de buurt.",
  kindKorps: "Korps",
  kindBuurt: "Buurthuiskamer",
  kindScouting: "Scouting",
  kindJeugd: "Jeugd",
  kindGidb: "Geloven in de Buurt",
  volunteerLink: "Vrijwilligerswerk bij jou in de buurt",
  volunteerBuurtLink: "Buurtwerk: meedoen dichtbij huis",
  volunteerGeneralLink: "Aan de slag in je buurt",

  signupTitle: "Hier kun je meedoen",
  signupIntro:
    "Laat je naam en e-mail achter. Zo houden we contact over vrijwilligerswerk bij jou in de buurt.",
  signupName: "Je naam",
  signupEmail: "Je e-mail",
  signupLunchTitle: "Win een gratis lunch",
  signupLunchBody:
    "We trekken na vandaag 3 winnaars. Iedereen mag meedoen.",
  signupConsent:
    "Ik geef toestemming dat het Leger des Heils mijn gegevens gebruikt voor de lunchloting en eventueel een korte vrijwilligersmail. Daarna worden ze verwijderd.",
  signupSubmit: "Versturen",
  signupSending: "Even versturen…",
  signupSkip: "Terug naar de kaart",
  signupNeedConsent: "Vink het vakje aan om mee te doen met de lunch.",
  signupNeedEmail: "Vul een geldig e-mailadres in.",
  signupNeedName: "Vul je naam in.",

  thanksTitle: "Top, bedankt!",
  thanksBody:
    "We hebben je gegevens ontvangen. Veel succes met de lunchloting en hopelijk tot snel bij het Leger des Heils.",
  thanksDone: "Klaar",

  adminTitle: "Export inschrijvingen",
  adminPin: "PIN",
  adminWrongPin: "Verkeerde PIN",
  adminExport: "Download CSV",
  adminOutboxCount: "nog niet verzonden (wachtrij)",
  adminClose: "Sluiten",
  adminOutboxEmpty: "Alles is verzonden. Geen wachtrij op dit scherm.",
  adminRotationTitle: "Schermrotatie",
  adminRotationHint:
    "Voor een liggend scherm dat rechtop hangt. Ook via ?rotate=90 of ?rotate=270 in de URL.",
  adminOutboxHint:
    "Als wifi hapert blijven inschrijvingen hier tot ze naar de server zijn gestuurd.",
  loadError: "Locaties laden mislukt. Vernieuw de pagina.",

  linksVolunteerVacancies: "https://www.legerdesheils.nl/vacatures/vrijwilligerswerk",
  linksBuurtwerk: "https://www.legerdesheils.nl/vacatures/buurtwerk",
  linksVolunteerForm: "https://www.legerdesheils.nl/vrijwilligerswerk",
  linksGidb: "https://gidb.legerdesheils.nl",
};

export type Messages = {
  [K in keyof typeof nl]: (typeof nl)[K] extends readonly string[]
    ? string[]
    : string;
};
