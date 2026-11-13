// The photos the site shows: one entry per image id in content/images.ts.
// fetch-and-build.mjs downloads each `base` from Unsplash, writes the local
// renditions to public/images/ and regenerates content/images.ts from this
// list (alt text and credits come from here; width, height and the
// placeholder colour are measured). Alt text describes what is in the photo.
//
// Fields: id, base (images.unsplash.com URL without query), page (the photo's
// Unsplash page), photographer (display name), handle (Unsplash username), alt,
// crop (optional [w, h] ratio for a source that is not landscape, e.g. [3, 2]).

export const photos = [
  {
    id: 'team-of-teams-hero',
    base: 'https://images.unsplash.com/photo-1647013302881-3f19103fd9f5',
    page: 'https://unsplash.com/photos/a-man-standing-in-front-of-a-wall-with-sticky-notes-on-it-c7qJLpNG5QY',
    photographer: 'Tommy Mason',
    handle: 'tommymmason',
    alt: 'A product design workshop: a wall covered in sticky notes being sorted',
    crop: [3, 2],
  },
  {
    id: 'team-of-teams-process',
    base: 'https://images.unsplash.com/photo-1758876203324-8ec35719f7a7',
    page: 'https://unsplash.com/photos/two-colleagues-discuss-sticky-notes-on-a-wall-ih8CXnU25UQ',
    photographer: 'Vitaly Gariev',
    handle: 'silverkblack',
    alt: 'Two colleagues discussing sticky notes on an office wall',
  },
  {
    id: 'shared-foundations-hero',
    base: 'https://images.unsplash.com/photo-1573496546639-d1c0722d1674',
    page: 'https://unsplash.com/photos/person-writing-on-whiteboard-JmIXIKtJ03Q',
    photographer: 'Christina @ wocintechchat.com M',
    handle: 'wocintechchat',
    alt: 'Someone sketching a component structure on a whiteboard',
  },
  {
    id: 'shared-foundations-process',
    base: 'https://images.unsplash.com/photo-1677506050896-78bf4d8f5ce4',
    page: 'https://unsplash.com/photos/a-man-standing-in-front-of-a-white-board-BO2z2Ak4M2g',
    photographer: 'Paymo',
    handle: 'paymo',
    alt: 'A presentation at a whiteboard with sticky notes in a meeting room',
  },
  {
    id: 'front-door-hero',
    base: 'https://images.unsplash.com/photo-1521066415397-46eef7ec423e',
    page: 'https://unsplash.com/photos/aerial-photography-of-brown-townhouse-h6Aoo7aTn0k',
    photographer: 'Joel & Jasmin Førestbird',
    handle: 'theforestbirds',
    alt: "Rooftops of Bern's old town seen from above",
  },
  {
    id: 'front-door-process',
    base: 'https://images.unsplash.com/photo-1758873269117-d5845126928a',
    page: 'https://unsplash.com/photos/team-collaborating-around-a-whiteboard-in-an-office-CdTQI-Nh7J4',
    photographer: 'Vitaly Gariev',
    handle: 'silverkblack',
    alt: 'A team mapping a process together at a whiteboard',
  },
  {
    id: 'management-principles',
    base: 'https://images.unsplash.com/photo-1758876203195-69a51e4145f0',
    page: 'https://unsplash.com/photos/two-people-brainstorming-with-sticky-notes-on-wall-ynkz9cpyvzI',
    photographer: 'Vitaly Gariev',
    handle: 'silverkblack',
    alt: 'Two people reviewing colourful sticky notes on a wall',
  },
  {
    id: 'management-workshops',
    base: 'https://images.unsplash.com/photo-1758876020211-ff39dd35a3bc',
    page: 'https://unsplash.com/photos/woman-writing-on-sticky-notes-on-a-wall-rBlRxCgWK10',
    photographer: 'Vitaly Gariev',
    handle: 'silverkblack',
    alt: 'A participant writing ideas on sticky notes during a workshop',
  },
  {
    id: 'about-roots',
    base: 'https://images.unsplash.com/photo-1594987975747-b0822d768bb2',
    page: 'https://unsplash.com/photos/aerial-view-of-city-near-mountains-during-daytime-bjzajETceI4',
    photographer: 'Alex Ghizila',
    handle: 'galex',
    alt: 'Interlaken from above, between two lakes and the mountains',
  },
  {
    id: 'about-lake',
    base: 'https://images.unsplash.com/photo-1571784157310-23547fa255c6',
    page: 'https://unsplash.com/photos/a-scenic-view-of-a-lake-surrounded-by-mountains-SMj2DY7QUfw',
    photographer: 'Rat Ski',
    handle: 'ratsk1',
    alt: 'A turquoise lake near Interlaken framed by forested mountains',
  },
  {
    id: 'about-og',
    base: 'https://images.unsplash.com/photo-1671423118843-ffd672bd5134',
    page: 'https://unsplash.com/photos/a-view-of-a-snow-covered-mountain-range-0bwiQpZae9k',
    photographer: 'Bo Zhang',
    handle: 'bozh_ntu',
    alt: 'The ice-covered mountain range seen from Interlaken',
  },
  {
    id: 'about-tcg',
    base: 'https://images.unsplash.com/photo-1506362802973-bd1717de901c',
    page: 'https://unsplash.com/photos/person-playing-with-cards-dttmeqFUDSU',
    photographer: 'Sergi Viladesau',
    handle: 'svi_designs',
    alt: 'Hands laying cards on a dark table',
  },
  {
    // An example portrait (About's hero), to be replaced by a real one: low-key, on a dark ground.
    id: 'about-portrait',
    base: 'https://images.unsplash.com/photo-1784209348722-e103832d5f7d',
    page: 'https://unsplash.com/photos/mans-face-in-profile-black-and-white--BecbFaSB9U',
    photographer: 'Nik Bagherzadegan',
    handle: 'nik_brz',
    alt: "A man's face in profile, black and white, against a dark background",
    crop: [4, 5],
  },
]
