/**
 * Seed script: Creates a Halifax Art Festival 2025 demo event with real event data.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-haf25.js <user-email>
 *
 * If no email provided, uses the first user in the database.
 */
import mongoose from 'mongoose';
import Event from '../src/models/Event.js';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-placer';

const HAF_CATEGORIES = [
  'Clay/Ceramics',
  'Digital',
  'Glass',
  'Jewelry',
  'Metal',
  'Mixed Media',
  'Painting',
  'Photography',
  'Printmaking/Drawing',
  'Sculpture',
  'Textiles',
  'Upcycled Arts',
  'Wood',
];

const INFO_SECTIONS = [
  {
    key: 'eventInfo',
    title: 'Event Information',
    content: `The 64th Annual Halifax Art Festival

Stewarded by the Riverfront Arts District, the Halifax Art Festival is one of Florida's longest-running juried art festivals and the second-oldest continually operating art festival in the state. Held in the historic downtown waterfront district of Daytona Beach, the Festival attracts over 35,000 art lovers annually.

This two-day outdoor event features the juried work of 200+ artists, with approximately 150 Fine Art spaces competing for cash awards. Fine artists and fine craft artisans are selected through a jury panel scoring process, ensuring a high-quality, well-curated show.

Artists exhibit along scenic Beach Street, overlooking the Halifax River, in a walkable, high-traffic riverfront setting surrounded by shops, cafes, and restaurants offering Festival specials. The event includes international street cuisine and live entertainment, creating a vibrant and welcoming atmosphere for artists and patrons alike.

The Halifax Art Festival offers large 12' x 12' booth spaces, professional event management, and a long-standing tradition of community support, making it a premier opportunity for artists seeking strong attendance, visibility, and recognition.

Show Dates: November 1st and 2nd, 2025
Website: www.HalifaxArtFestival.com`,
  },
  {
    key: 'generalInfo',
    title: 'General Information',
    content: `JURY AND BOOTH FEES:
  $40 - Jury Fee (non-refundable)
  $350 - Juried: Competitive Fine Art booth space
  $225 - Juried: Non-competing arts and juried craft booth spaces

ARTIST AMENITIES:
- Branding Image Contest for 2025 Tee Shirt Artist
- Patron and Fine Art Cash Awards
- Discounted hotel accommodations
- Friday Registration and Set Up
- Saturday Morning Set up is available
- Booth sitting both days of festival
- Morning coffee and bakery goods
- Complimentary Parking / Overnight Parking
- Festival Security Friday and Saturday nights
- No additional charge for corners / end booth locations
- Winners invitation to HAF award ceremony Sunday morning

REGISTRATION AND BOOTH SET UP: Friday, October 31st phased times, to be announced. Saturday morning set-up is permitted, however access to several areas on Saturday will require the use of a dolly.

FESTIVAL ADVERTISING: Extensive multi-media marketing campaign to the Volusia/Flagler area to reach locals and "snowbirds". Advertising includes newspapers, local magazines, and radio as well social media platforms.

ARTIST AWARDS AND PATRON DOLLARS: Best of Show will be awarded $5000. We have an active and growing HAF Patron Program which provides patrons with "HAF Patron Dollars" to use for artwork purchases. Only Competitive Fine Artists are eligible for artist cash award prize monies.

JURY FEE AND JURY EXEMPTIONS: All applicants must pay the $40 Jury Fee. Exception: (24) Jury fee exemptions are provided to our winners of last year's Halifax Art Festival.

TWO EXHIBITOR SECTIONS:
Competitive Fine Artists - Juried selection made by Jury Panel. Fine Artists are judged for cash awards. Fine Art booth spaces are located on Beach Street (asphalt surface). 153 competitive booth spaces available (Booths #1 - 153).
Noncompetitive Artists and Craft Artisans - Juried selection process. Not eligible for cash awards. Approximately 60 spaces (Booths #154 - 203, P1 - P19).

ARTIST MEDIA CATEGORIES:
${HAF_CATEGORIES.join('\n')}
No weaponry please.

APPLICATION REQUIREMENTS:
- 4 images required: Three (3) images of recent artwork (created within last 3 years) + One (1) booth display image
- Booth image must NOT include the face of the artist nor the artist's name
- Artist Bio describing background, artwork, and techniques
- Signature of Agreement to follow Halifax Art Festival Policies

IMPORTANT DATES:
  June 30th - Application Deadline
  July 1-5th - Jury Panel Selection
  July 7th - Artist Invitations begin
  July 22nd - All payments due to confirm
  August 1st - Last day for cancellation with 80% refund
  November 1-2 - Show Dates

PAYMENT OPTIONS:
- Credit card through ZAPP application only
- Check payable to "Halifax Art Festival" by mail

FESTIVAL PLACEMENT:
Competitive Fine Artists on Beach Street (Booths #1 - 153):
  East-facing booths front to Esplanade Park (Booths #1 - 69)
  West-facing booths front to shops, parking behind (Booths #70 - 153)

Non-competing artists/crafters:
  Esplanade Park grass, east of N. Beach Street (Booths #P1 - P19)
  Magnolia Avenue north-facing (#154 - 186) and south-facing (#187 - 203)

Corners and 'ends' locations assigned based on artist's total jury panel scores.`,
  },
  {
    key: 'boothInfo',
    title: 'Booth Information',
    content: `Booth space is 12 ft by 12 ft with 2 foot separation between spaces.

Tents must be professional, 10 x 10 foot with white top canopies and have side curtains for securing tent.

Tent Weight Requirements:
- Minimum weight: 40 lbs on each tent leg (60 lbs highly suggested)
- Permitted: Tube weights, sand bag weights, concrete filled buckets, stabilizer bars with sandbags, weight plates, water weights
- Not permitted: Visible concrete blocks or bricks, grid only or stabilizer only without weights, dumbbells

No camping tents allowed.

Setup & Operations:
- Booth spaces marked using tape or flags
- Tent set up begins on Friday (phased times to be announced)
- Saturday morning set up is permitted
- Exhibitors should be prepared with rain covers, tie-downs, and weights
- Not all booth locations are totally level - levelling devices may be needed
- We cannot aid with booth setup

Power & Generators:
- Power is generally not available to artists
- The use of generators is prohibited due to disturbance to guests and other exhibitors

Tents:
- We do not provide tents but will assist artists in locating one
- Each exhibitor is responsible for his/her own display in case of loss or damage
- We recommend that artists carry insurance`,
  },
  {
    key: 'rulesRegulations',
    title: 'Rules & Regulations',
    content: `1. All artwork must be the original work of the accepted artist only. No agents, proxies, or commercial dealers are permitted.
2. No Buy/Sell exhibitors are permitted. Offenders will be asked to remove items and/or leave. No refunds.
3. Juried exhibitors (including collaborators) MUST BE PRESENT during the entire 2 days of festival.
4. Collaborative Artists - No more than 2 artists permitted as collaborators. Both must be present during 2 days.
5. Exhibitors who dismantle booths early (before 4PM Sunday) will likely not be invited to return.
6. Booth Cards must be on display throughout the festival (artist name, hometown, category, space number). Must be displayed by 9AM Saturday for judging.
7. Exhibitors are responsible for paying Florida sales tax (forms provided in registration packet).
8. Jury Fee of $40 required of all applicants. Exemptions awarded to last year's winning fine artists.
9. Each artist must enter individually unless collaborative effort by 2 artists.
10. Artists may only exhibit artwork media accepted by the jury panel.
11. Additional media (max 2) within one booth requires separate application with jury fee.
12. Artwork eligible for judging must be original work created since 2021. No previously awarded work.
13. Prints must be signed, numbered, and limited to 350. No laser prints.
14. Ceramics that are hydraulic pressed are not permitted.
15. Only original works displayed. Prints may be placed in bins to front or back of booth.
16. Displays viewed at intervals to ensure rule compliance. Violations result in removal of unacceptable material.
17. One juried artist per space, unless juried as collaborative team.
18. Judging of Competitive Fine Arts begins Saturday at 9 AM. Booth card must be posted.
19. Vehicles not permitted in exhibit area until 4:30PM Sunday. Artists must breakdown booth before bringing vehicles in.
20. No affiliation, ribbons or publications about the artist may be displayed prior to judging.
21. Unacceptable: Decoupage, commercial photographs, mass produced jewelry, manufactured bags/belts, non-original or kit work, commercially produced products.
22. Only artists accepted by Jury Panel in jewelry category may display and sell jewelry.
23. Exhibitors who fail to show and/or leave without notifying risk not being invited back.
24. Returning artists: every effort to position at or near previous year's booth location with Jury Panel approval.
25. Previous year's winners have first opportunity to choose booth locations prior to deadline.
26. No changes of booth assignments unless directed by Festival Chairperson or Artist Contact.
27. Layout designed to ensure balance; corners/ends assigned based on jury panel scores.
28. Any breach of rules forfeits all rights and results in immediate dismissal without refund.

Questions? Contact: Theresa@im-daytona.com`,
  },
  {
    key: 'refundPolicy',
    title: 'Refund Policy',
    content: `Artist cancellations must be communicated in writing (email to: Theresa@im-daytona.com) from the artist by August 1st to receive an 80% booth fee refund less the credit card fee and a $25 admin fee.

Jury Fee is non-refundable.

Text messages are not to be used for cancellations.

No refunds of booth fee will be made after August 1st.`,
  },
  {
    key: 'juryDetails',
    title: 'Jury Details',
    content: `Average number of applications submitted each year: 250
Average number of artists selected from the jury to participate: 200
Average number of exempt from jury artists invited to participate: 10

How returning artists are selected:
- Received an award
- Selected by show director or board
- History of participation
- Local artist

Vendors excluded/ineligible: buy/sell artists

How images are viewed by jurors: Computer monitor

Within a medium category, applications are sorted and viewed by: Last Name (ascending order)

Jurors score applications using the following scale: Yes, No, or Maybe
Number of jurors scoring applications: 3

The show organizes the jurors for a: Single jury panel that scores applications for all medium categories

Jurors score: Separately from various locations

Am I allowed to observe the jury process? Jury process is open for all dates

Jury Panel convenes July 1-5. Artists notified by email beginning two days after conclusion. Selection based on cumulative scores of each image. Two separate panels for Competitive and Noncompetitive applications. No quotas for individual media categories, but the Jury strives for balance.`,
  },
];

// Sample vendors representing a realistic mix of HAF applicants
const SAMPLE_VENDORS = [
  // Competitive Fine Artists
  { name: 'Eleanor Vance', category: 'Painting', tier: 'competitive', email: 'eleanor.v@example.com', businessName: 'Vance Fine Art', description: 'Oil and acrylic large-scale seascapes inspired by the Atlantic coast', boothSize: 1, status: 'approved' },
  { name: 'Richard Kuo', category: 'Photography', tier: 'competitive', email: 'rkuo@example.com', businessName: 'Kuo Photography', description: 'Fine art landscape and nature photography, archival prints', boothSize: 1, status: 'approved' },
  { name: 'Sandra Okafor', category: 'Sculpture', tier: 'competitive', email: 'sandra.o@example.com', businessName: 'Okafor Sculpture Studio', description: 'Bronze figurative sculptures and mixed-metal installations', boothSize: 1, status: 'approved' },
  { name: 'William Chen', category: 'Glass', tier: 'competitive', email: 'wchen@example.com', businessName: 'Chen Glass Works', description: 'Hand-blown glass vessels, platters, and decorative art', boothSize: 1, status: 'approved' },
  { name: 'Angela Torres', category: 'Jewelry', tier: 'competitive', email: 'angela.t@example.com', businessName: 'Torres Metalwork', description: 'Fabricated sterling and gold jewelry with precious stones', boothSize: 1, status: 'approved' },
  { name: 'Douglas Hart', category: 'Mixed Media', tier: 'competitive', email: 'dhart@example.com', businessName: 'Hart Studios', description: 'Encaustic and collage on wood panel, abstract expressionism', boothSize: 1, status: 'approved' },
  { name: 'Patricia Lane', category: 'Printmaking/Drawing', tier: 'competitive', email: 'plane@example.com', businessName: 'Lane Print Studio', description: 'Intaglio and lithograph limited edition fine art prints', boothSize: 1, status: 'approved' },
  { name: 'Kenneth Moss', category: 'Painting', tier: 'competitive', email: 'kmoss@example.com', businessName: 'Moss Art', description: 'Plein air watercolor landscapes of Florida rivers and marshes', boothSize: 1, status: 'approved' },
  { name: 'Julia Beck', category: 'Clay/Ceramics', tier: 'competitive', email: 'jbeck@example.com', businessName: 'Beck Ceramics', description: 'High-fire stoneware vessels and functional pottery', boothSize: 1, status: 'approved' },
  { name: 'Steven Grant', category: 'Metal', tier: 'competitive', email: 'sgrant@example.com', businessName: 'Grant Forge', description: 'Forged iron and copper wall sculptures and garden art', boothSize: 1, status: 'approved' },
  { name: 'Nancy Cole', category: 'Photography', tier: 'competitive', email: 'ncole@example.com', businessName: 'Cole Images', description: 'Black and white street photography and urban landscapes', boothSize: 1, status: 'approved' },
  { name: 'Christopher Bell', category: 'Digital', tier: 'competitive', email: 'cbell@example.com', businessName: 'Bell Digital Art', description: 'Digitally composited surrealist landscapes on metal prints', boothSize: 1, status: 'approved' },
  { name: 'Margaret Reed', category: 'Painting', tier: 'competitive', email: 'mreed@example.com', businessName: 'Reed Studio', description: 'Contemporary abstract oil paintings on large canvas', boothSize: 1, status: 'approved' },
  { name: 'Frank Russo', category: 'Sculpture', tier: 'competitive', email: 'frusso@example.com', businessName: 'Russo Art', description: 'Carved stone and marble figurative work', boothSize: 1, status: 'applied' },
  { name: 'Deborah Price', category: 'Glass', tier: 'competitive', email: 'dprice@example.com', businessName: 'Price Glass', description: 'Kiln-formed glass platters and wall installations', boothSize: 1, status: 'applied' },
  // Noncompetitive Artists & Craft Artisans
  { name: 'Karen Walsh', category: 'Textiles', tier: 'noncompetitive', email: 'kwalsh@example.com', businessName: 'Walsh Fiber Art', description: 'Hand-dyed silk scarves and woven wall hangings', boothSize: 1, status: 'approved' },
  { name: 'Brian Maxwell', category: 'Wood', tier: 'noncompetitive', email: 'bmaxwell@example.com', businessName: 'Maxwell Woodworks', description: 'Hand-turned wooden bowls, vases, and decorative objects', boothSize: 1, status: 'approved' },
  { name: 'Teresa Long', category: 'Jewelry', tier: 'noncompetitive', email: 'tlong@example.com', businessName: 'TL Designs', description: 'Handcrafted beaded and wire-wrapped jewelry', boothSize: 1, status: 'approved' },
  { name: 'Gregory Adams', category: 'Upcycled Arts', tier: 'noncompetitive', email: 'gadams@example.com', businessName: 'ReNew Art', description: 'Sculptures and functional art from reclaimed materials', boothSize: 1, status: 'approved' },
  { name: 'Diane Foster', category: 'Clay/Ceramics', tier: 'noncompetitive', email: 'dfoster@example.com', businessName: 'Foster Pottery', description: 'Handbuilt decorative ceramic tiles and garden art', boothSize: 1, status: 'approved' },
  { name: 'Paul Mitchell', category: 'Mixed Media', tier: 'noncompetitive', email: 'pmitchell@example.com', businessName: 'Mitchell Art', description: 'Assemblage art combining found objects and paint', boothSize: 1, status: 'applied' },
  { name: 'Linda Soto', category: 'Painting', tier: 'noncompetitive', email: 'lsoto@example.com', businessName: 'Soto Creations', description: 'Acrylic pour paintings and resin art', boothSize: 1, status: 'applied' },
  { name: 'Mark Dunn', category: 'Photography', tier: 'noncompetitive', email: 'mdunn@example.com', businessName: 'Dunn Photos', description: 'Florida wildlife and nature photography on canvas', boothSize: 1, status: 'applied' },
  { name: 'Susan Perry', category: 'Textiles', tier: 'noncompetitive', email: 'sperry@example.com', businessName: 'Perry Quilts', description: 'Art quilts and fiber wall pieces', boothSize: 1, status: 'waitlisted' },
  { name: 'Jason King', category: 'Wood', tier: 'noncompetitive', email: 'jking@example.com', businessName: 'King Carpentry', description: 'Handcrafted cutting boards and wooden home decor', boothSize: 1, status: 'waitlisted' },
];

async function seed() {
  const email = process.argv[2];

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let user;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }
  } else {
    user = await User.findOne();
    if (!user) {
      console.error('No users in database. Sign up first, then run this script.');
      process.exit(1);
    }
  }

  console.log(`Seeding for user: ${user.email}`);

  const eventName = '64th Annual Halifax Art Festival';

  const existing = await Event.findOne({ owner: user._id, name: eventName });
  if (existing) {
    console.log('Halifax Art Festival event already exists, updating...');
    existing.infoSections = INFO_SECTIONS;
    existing.vendors = SAMPLE_VENDORS;
    existing.vendorPortal = {
      enabled: true,
      inviteToken: 'haf25-demo',
      maxSpotChoices: 3,
      signupDeadline: new Date('2025-06-30'),
      instructions: 'Welcome to the Halifax Art Festival Vendor Portal! Please complete your application below. A $40 non-refundable jury fee is required. You will need three (3) images of recent artwork and one (1) booth display image. Booth image must NOT include the artist\'s face or name.',
      requirePayment: false,
    };
    existing.settings = {
      noSameAdjacentCategories: ['Painting', 'Jewelry', 'Photography', 'Glass', 'Sculpture'],
      pricingConfig: {
        tiers: {
          competitive: { base: 350, label: 'Competitive Fine Art' },
          noncompetitive: { base: 225, label: 'Non-Competitive / Craft' },
        },
        doubleSpaceMultiplier: 1.0,
        premiumMultiplier: 1.0,
      },
    };
    await existing.save();
    console.log(`Updated event: ${existing._id}`);
  } else {
    const event = await Event.create({
      owner: user._id,
      name: eventName,
      infoSections: INFO_SECTIONS,
      vendors: SAMPLE_VENDORS,
      vendorPortal: {
        enabled: true,
        inviteToken: 'haf25-demo',
        maxSpotChoices: 3,
        signupDeadline: new Date('2025-06-30'),
        instructions: 'Welcome to the Halifax Art Festival Vendor Portal! Please complete your application below. A $40 non-refundable jury fee is required. You will need three (3) images of recent artwork and one (1) booth display image. Booth image must NOT include the artist\'s face or name.',
        requirePayment: false,
      },
      settings: {
        noSameAdjacentCategories: ['Painting', 'Jewelry', 'Photography', 'Glass', 'Sculpture'],
        pricingConfig: {
          tiers: {
            competitive: { base: 350, label: 'Competitive Fine Art' },
            noncompetitive: { base: 225, label: 'Non-Competitive / Craft' },
          },
          doubleSpaceMultiplier: 1.0,
          premiumMultiplier: 1.0,
        },
      },
    });
    console.log(`Created event: ${event._id}`);
  }

  console.log(`\nHalifax Art Festival seeded successfully!`);
  console.log(`  - 25 sample vendors (15 competitive, 10 noncompetitive)`);
  console.log(`  - 6 info sections filled with real HAF data`);
  console.log(`  - Vendor portal enabled (invite link: /vendor/haf25-demo)`);
  console.log(`  - Pricing: Competitive $350, Non-Competitive $225`);
  console.log(`  - 153 competitive spaces (Beach St) + ~60 noncompetitive spaces`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
