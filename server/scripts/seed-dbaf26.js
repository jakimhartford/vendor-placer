/**
 * Seed script: Creates a DBAF26 demo event with real event data.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-dbaf26.js <user-email>
 *
 * If no email provided, uses the first user in the database.
 */
import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Event from '../src/models/Event.js';
import User from '../src/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vendor-placer-secret';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-placer';

const DBAF_CATEGORIES = [
  'Bath & Body Products',
  'Drawing',
  'Edibles',
  'Fashion and Wearable Art',
  'Glass Art',
  'Graphic Design / Digital Art',
  'Jewelry',
  'Mixed Media',
  'Painting',
  'Photography',
  'Sculpture',
  'Textiles / Fiber Arts',
  'Other',
];

const INFO_SECTIONS = [
  {
    key: 'eventInfo',
    title: 'Event Information',
    content: `#DBAF26: An Art Immersive Experience
Expanded Prize Purse, The Return of People's Choice + New Emergent Artist Category for Students!

The 5th Annual Daytona Beach Arts Fest returns April 11\u201312, 2026, with a bold vision and a renewed commitment to creativity, community, and cultural connection. This year features a larger prize purse for juried artists\u2014and the fan-favorite People's Choice Award is back!

More than a fine arts festival, DBAF26 is a full-scale immersive experience. We unite award-winning artists, emerging talent, artisans, and local organizations to energize Downtown Daytona Beach with vibrant expression. The Riverfront Esplanade and Beach Street corridor provide a stunning backdrop for this celebration of art and culture.

Festival Highlights:
- Live art demos & installations
- Music, dance, & performance art
- Interactive zones & live painting
- Artisan markets & creative pop-ups
- Food, drink & community fun

New in 2026: Emergent Artist Program
We're proud to debut this student-focused initiative, open to all currently enrolled students with valid ID. Selected artists will showcase their work and compete for dedicated awards to help launch their careers.

Join us for a weekend of creativity, discovery, and inspiration in the heart of Downtown Daytona Beach!`,
  },
  {
    key: 'generalInfo',
    title: 'General Information',
    content: `ARTIST AWARDS
$2500 Best in Show
$1500 First Place
$750 Second Place
$500 Third Place
$500 People's Choice
$200 Honorable Mention

A $35 application processing fee is due at the time of application. This fee is non-refundable. Coupon codes do not apply to the application fee.
Please check our website frequently for updates at www.DaytonaBeachArtsFest.com

EXHIBITOR SECTIONS:
  Juried Fine Artists: judged for monetary awards
  Non-Juried Fine Art/Artists & Craft Vendors: not judged for fine art awards

APPLICATION REQUIREMENTS:
Application Fee: $35.00 (non-refundable)
Images: Three (3) images of recent work and one (1) image of exhibit space

FEES:
Application Fee $35 (non-refundable): The application fee submitted to Riverfront Arts District, Inc. is a non-refundable fee.

Single Space (10x12):
  $250 - Juried Fine Artist Space
  $175 - Non-Juried Artist / Arts & Crafts Marketplace

Double Space (10x22) - Limited availability:
  $425 - Juried Fine Artist
  $275 - Non-Juried Artist / Arts & Crafts Marketplace

Emergent Artist Fee (must be a student at time of show on April 11, 2026 and present Student ID at check-in):
  $75 - Single Space (10x12)

MEDIA CATEGORIES:
${DBAF_CATEGORIES.join('\n')}

AWARD JUDGING PANEL: Show Judging is based on the overall body of work in an applied category.`,
  },
  {
    key: 'boothInfo',
    title: 'Booth Information',
    content: `Booth Sizes & Pricing
Each exhibitor space measures 12 feet wide by 12 feet deep. A limited number of double spaces (12x22) are available.

Space Type          | Single Space | Double Space
Juried Fine Artist  | $250         | $425
Non-Juried / Marketplace | $175    | $275

Note: All displays, tents, and equipment must fit entirely within the designated booth footprint.

Tent & Display Requirements
- Tents must be professional-grade, 10x10 ft (or 10x20 ft for double space).
- No camping tents allowed.
- Booths must be strong enough to withstand wind, weather, and large crowds.
- No ground staking is permitted.

Recommended Tent Weights (Required for Safety):
  Tube weights, sandbag weights, concrete-filled buckets, weight plates, stabilizer bars with sandbags. Raw concrete blocks, dumbbells, and water containers are also permitted but must be kept completely out of walkways.

Any unsecured tent poses a risk and may be subject to removal by festival staff for safety reasons.

Setup & Festival Operations
- Festival map and booth assignments will be emailed one week before the event.
- Setup begins: Friday at 9:00 AM.
- Booths must be fully set up by Saturday 9:00 AM, Sunday 10:00 AM.
- All spaces will be clearly marked in advance.
- Exhibitors may not move or switch spaces without approval from the Festival Chair or Artist Coordinator.
- Premium spaces (corners, ends) are assigned based on total jury scores and availability.

Electricity: Power is available in limited locations at no extra charge. You must request electricity on your application.

Tents Are Not Provided. Need to rent? Contact Special Event Services: (386) 760-6111 / www.iamevents.com

Weather Preparedness: The festival is rain or shine. Bring rain covers, tie-downs, and additional support items.

RAD staff will not assist with booth setup. Please plan accordingly.`,
  },
  {
    key: 'rulesRegulations',
    title: 'Rules & Regulations',
    content: `Festival Rules & Regulations
Presented by the Riverfront Arts District (RAD)
Daytona Beach Arts Fest (DBAF)

Security & Liability
Although 24-hour security surveillance will be in place for the duration of the festival, Riverfront Arts District (RAD) is not responsible for any lost, stolen, or damaged property. Exhibitors are solely responsible for securing their artwork, displays, and personal belongings.

Buy/Sell Policy
No Buy/Sell exhibitors are permitted. All work displayed and sold must be the original, handcrafted creation of the artist. Work made by others or bought for resale is strictly prohibited. Violators will be required to immediately vacate the festival without refund.

Exhibitor Participation Requirements
- Presence Required: Exhibitors must be present for the full two days of the festival.
- No Early Breakdown: Booths may not be dismantled or closed before 4:00 PM on Sunday.
- Exit Procedure: An organized exit plan will be implemented. No breakdown may begin before 4:00 PM.
- Minimum Display: Each booth must display a minimum of 4 original pieces of artwork.
- Identification: Festival-issued space cards must be visibly displayed at all times.
- Clean-Up: All vendors must vacate and leave their space clean by 9:00 PM on Sunday.

Sales Tax Requirements
Artists are responsible for collecting and reporting Florida state sales tax on all sales made during the festival. Tax reporting forms will be available at check-in or may be downloaded from the Florida Department of Revenue: http://dor.myflorida.com/Pages/forms_index.aspx

Eligibility & Application Guidelines
- Application Fee: A non-refundable $35 application fee is required of all applicants.
- Processing Time: Please allow up to 14 days for review and notification of acceptance.
- Juried Artists: May only exhibit work in the medium specified in their application.
- Non-Juried Artists / Arts & Crafts Vendors: Must exhibit only in their approved category.
- Collaborative Work: Only artists creating work collaboratively may apply as a team.

Prohibited Items & Practices
The following are not permitted and may result in immediate dismissal without refund:
- Copies or reproductions of masterworks, commercial photography, advertisements, or offset prints
- Production, mass-produced, or kit-based artwork in any category
- Work purchased for resale or made using commercial molds
- Manufactured jewelry or items from kits
- Commercial signage, displays, or non-art merchandise
- Artwork not matching the approved category on the application
- Unsigned or non-archival work
- Vulgar, racist, or explicit imagery

General Festival Policies
- The festival will take place rain or shine.
- No refunds will be issued for any reason, including dismissal due to rule violations.
- Submission of your application constitutes agreement to all rules and policies.

Questions? Contact us at: theresa@im-daytona.com`,
  },
  {
    key: 'refundPolicy',
    title: 'Refund Policy',
    content: `Cancellation Deadline: Refund requests must be submitted in writing to our festival administration no later than 30 days before the event's start date. Any requests received after this deadline will not be eligible for a refund.

Partial Refunds: If a refund request is submitted within the stipulated cancellation deadline, the vendor will be eligible for a partial refund. A processing fee, as specified in the vendor agreement, will be deducted from the total amount paid.

Non-Refundable Deposit: A non-refundable deposit, as outlined in the vendor agreement, is applicable to all vendor bookings. This deposit will not be refunded under any circumstances, regardless of the cancellation date.

Event Cancellation: In the event that DBAF is canceled due to unforeseen circumstances (natural disasters, government regulations), vendors will be eligible for a refund of their participation fees, excluding the non-refundable deposit.

Refund Processing Time: Approved refunds will be processed within 30 days following the event. Please allow additional time for the refund to reflect in your account.

Transfers and Substitutions: Vendor registrations are non-transferable. However, substitutions within the same vendor category may be considered, subject to approval by the festival organizers.

For questions or refund requests, contact: theresa@im-daytona.com`,
  },
  {
    key: 'juryDetails',
    title: 'Jury Details',
    content: `Average number of applications submitted each year: 200
Average number of artists selected from the jury to participate: 100
Average number of exempt from jury artists invited to participate: 10

How returning artists are selected: Selected by show director or board
How images are viewed by jurors: Computer monitor

Within a medium category, applications are sorted and viewed by: Application Received (date the application was submitted)

Jurors score applications using the following scale: Yes, No, or Maybe
Number of jurors scoring applications: 3

The show organizes the jurors for a: Single jury panel that scores applications for all medium categories

Jurors score: Separately from various locations

Am I allowed to observe the jury process? Jury process is open for all dates`,
  },
];

// Sample vendors representing a realistic mix of DBAF applicants
const SAMPLE_VENDORS = [
  { name: 'Maria Gonzalez', category: 'Painting', tier: 'juried', email: 'maria.g@example.com', businessName: 'Maria Gonzalez Fine Art', description: 'Contemporary acrylic landscapes inspired by Florida coastlines', boothSize: 1, status: 'approved' },
  { name: 'James Chen', category: 'Photography', tier: 'juried', email: 'jchen@example.com', businessName: 'Chen Photography', description: 'Fine art black & white nature photography', boothSize: 1, status: 'approved' },
  { name: 'Aisha Williams', category: 'Sculpture', tier: 'juried', email: 'aisha.w@example.com', businessName: 'Aisha Creates', description: 'Bronze and mixed-metal abstract sculptures', boothSize: 2, status: 'approved' },
  { name: 'Robert Taylor', category: 'Glass Art', tier: 'juried', email: 'rtaylor@example.com', businessName: 'Taylor Glass Studio', description: 'Hand-blown glass vessels and functional art', boothSize: 1, status: 'approved' },
  { name: 'Sofia Martinez', category: 'Jewelry', tier: 'juried', email: 'sofia.m@example.com', businessName: 'Sol & Luna Jewelry', description: 'Sterling silver and semi-precious gemstone jewelry', boothSize: 1, status: 'approved' },
  { name: 'David Kim', category: 'Mixed Media', tier: 'juried', email: 'dkim@example.com', businessName: 'DK Art Studio', description: 'Layered collage and assemblage works on wood panels', boothSize: 1, status: 'approved' },
  { name: 'Emily Brooks', category: 'Drawing', tier: 'juried', email: 'emily.b@example.com', businessName: 'Brooks Illustration', description: 'Graphite and charcoal botanical illustrations', boothSize: 1, status: 'approved' },
  { name: 'Marcus Johnson', category: 'Painting', tier: 'juried', email: 'marcus.j@example.com', businessName: 'MJ Art', description: 'Large-scale oil paintings of urban landscapes', boothSize: 2, status: 'approved' },
  { name: 'Lisa Park', category: 'Textiles / Fiber Arts', tier: 'nonjuried', email: 'lisa.p@example.com', businessName: 'Woven Dreams', description: 'Hand-woven tapestries and fiber wall hangings', boothSize: 1, status: 'approved' },
  { name: 'Carlos Rivera', category: 'Sculpture', tier: 'juried', email: 'carlos.r@example.com', businessName: 'Rivera Metal Works', description: 'Welded steel outdoor sculptures and garden art', boothSize: 2, status: 'approved' },
  { name: 'Hannah White', category: 'Graphic Design / Digital Art', tier: 'nonjuried', email: 'hannah.w@example.com', businessName: 'Pixel & Print', description: 'Limited edition digital art prints and posters', boothSize: 1, status: 'approved' },
  { name: 'Thomas Moore', category: 'Photography', tier: 'juried', email: 'tmoore@example.com', businessName: 'Moore Lens', description: 'Aerial and drone photography of Florida landscapes', boothSize: 1, status: 'approved' },
  { name: 'Rachel Green', category: 'Fashion and Wearable Art', tier: 'nonjuried', email: 'rachel.g@example.com', businessName: 'Art to Wear', description: 'Hand-painted silk scarves and wearable art pieces', boothSize: 1, status: 'approved' },
  { name: 'Kevin Patel', category: 'Mixed Media', tier: 'juried', email: 'kevin.p@example.com', businessName: 'Patel Studio', description: 'Resin and wood hybrid wall art', boothSize: 1, status: 'applied' },
  { name: 'Naomi Scott', category: 'Painting', tier: 'juried', email: 'naomi.s@example.com', businessName: 'Naomi Scott Art', description: 'Watercolor portraits and figure studies', boothSize: 1, status: 'applied' },
  { name: 'Derek Brown', category: 'Glass Art', tier: 'nonjuried', email: 'derek.b@example.com', businessName: 'Fusion Glass Co', description: 'Fused glass jewelry and decorative panels', boothSize: 1, status: 'applied' },
  { name: 'Olivia Adams', category: 'Jewelry', tier: 'nonjuried', email: 'olivia.a@example.com', businessName: 'OA Designs', description: 'Handcrafted beaded jewelry and wire wrapping', boothSize: 1, status: 'applied' },
  { name: 'Michael Lee', category: 'Sculpture', tier: 'juried', email: 'michael.l@example.com', businessName: 'Lee Ceramics', description: 'Wheel-thrown and hand-built ceramic vessels', boothSize: 1, status: 'applied' },
  { name: 'Sarah Nelson', category: 'Bath & Body Products', tier: 'nonjuried', email: 'sarah.n@example.com', businessName: 'Coastal Botanicals', description: 'Handmade soaps, bath bombs, and body oils', boothSize: 1, status: 'applied' },
  { name: 'Jake Hernandez', category: 'Painting', tier: 'emergent', email: 'jake.h@example.com', businessName: '', description: 'Student artist - abstract expressionism on canvas', boothSize: 1, status: 'applied' },
  { name: 'Mia Thompson', category: 'Drawing', tier: 'emergent', email: 'mia.t@example.com', businessName: '', description: 'Student artist - pen and ink architectural studies', boothSize: 1, status: 'applied' },
  { name: 'Zoe Campbell', category: 'Edibles', tier: 'nonjuried', email: 'zoe.c@example.com', businessName: 'Sweet Coast Bakery', description: 'Artisan cookies, brownies, and handmade chocolates', boothSize: 1, status: 'approved' },
  { name: 'Paul Wright', category: 'Other', tier: 'nonjuried', email: 'paul.w@example.com', businessName: 'Wright Woodcraft', description: 'Hand-turned wooden bowls and kitchen utensils', boothSize: 1, status: 'approved' },
  { name: 'Diana Cruz', category: 'Textiles / Fiber Arts', tier: 'nonjuried', email: 'diana.c@example.com', businessName: 'Stitch & Story', description: 'Quilted wall art and embroidered home goods', boothSize: 1, status: 'waitlisted' },
  { name: 'Ryan Foster', category: 'Photography', tier: 'nonjuried', email: 'ryan.f@example.com', businessName: 'Foster Frames', description: 'Coastal sunset photography on canvas and metal', boothSize: 1, status: 'waitlisted' },
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

  function buildVendors(eventId) {
    return SAMPLE_VENDORS.map((v) => {
      const id = crypto.randomUUID();
      const vendorToken = jwt.sign({ eventId: eventId.toString(), vendorId: id, type: 'vendor' }, JWT_SECRET, { expiresIn: '90d' });
      return {
        ...v,
        id,
        vendorToken,
        premium: false,
        booths: v.boothSize || 1,
        bid: 0,
        exclusions: [],
        conflicts: [],
        spotPreferences: [],
        insuranceStatus: 'none',
        appliedAt: new Date('2026-01-10').toISOString(),
        approvedAt: v.status === 'approved' ? new Date('2026-02-01').toISOString() : undefined,
        notes: '',
      };
    });
  }

  // Check if event already exists
  const existing = await Event.findOne({ owner: user._id, name: 'DBAF26: Daytona Beach Arts Fest' });
  if (existing) {
    console.log('DBAF26 event already exists, updating...');
    existing.categories = DBAF_CATEGORIES;
    existing.infoSections = INFO_SECTIONS;
    existing.vendors = buildVendors(existing._id);
    existing.vendorPortal = {
      enabled: true,
      inviteToken: 'dbaf26-demo',
      maxSpotChoices: 3,
      signupDeadline: new Date('2026-03-15'),
      instructions: 'Welcome to the DBAF26 Vendor Portal! Please complete your application below. A $35 non-refundable application fee is required. You will need three (3) images of recent work and one (1) image of your exhibit space.',
      requirePayment: false,
    };
    existing.settings = {
      noSameAdjacentCategories: ['Painting', 'Jewelry', 'Photography', 'Glass Art', 'Sculpture'],
      pricingConfig: {
        mode: 'flat',
        flatFees: {
          juried: { single: 250, double: 425, label: 'Juried Fine Artist' },
          nonjuried: { single: 175, double: 275, label: 'Non-Juried / Marketplace' },
          emergent: { single: 75, double: 75, label: 'Emergent Artist (Student)' },
        },
      },
    };
    await existing.save();
    console.log(`Updated event: ${existing._id}`);
  } else {
    const event = await Event.create({
      owner: user._id,
      name: 'DBAF26: Daytona Beach Arts Fest',
      categories: DBAF_CATEGORIES,
      infoSections: INFO_SECTIONS,
      vendors: [],
      vendorPortal: {
        enabled: true,
        inviteToken: 'dbaf26-demo',
        maxSpotChoices: 3,
        signupDeadline: new Date('2026-03-15'),
        instructions: 'Welcome to the DBAF26 Vendor Portal! Please complete your application below. A $35 non-refundable application fee is required. You will need three (3) images of recent work and one (1) image of your exhibit space.',
        requirePayment: false,
      },
      settings: {
        noSameAdjacentCategories: ['Painting', 'Jewelry', 'Photography', 'Glass Art', 'Sculpture'],
        pricingConfig: {
          tiers: {
            juried: { base: 250, label: 'Juried Fine Artist' },
            nonjuried: { base: 175, label: 'Non-Juried / Marketplace' },
            emergent: { base: 75, label: 'Emergent Artist (Student)' },
          },
          doubleSpaceMultiplier: 1.7,
          premiumMultiplier: 1.0,
        },
      },
    });
    event.vendors = buildVendors(event._id);
    await event.save();
    console.log(`Created event: ${event._id}`);
  }

  // Log demo vendor tokens
  const savedEvent = await Event.findOne({ owner: user._id, name: 'DBAF26: Daytona Beach Arts Fest' });
  const demoVendors = savedEvent.vendors.filter((v) => v.vendorToken).slice(0, 3);
  if (demoVendors.length) {
    console.log(`\nDemo vendor login URLs (paste in browser):`);
    for (const v of demoVendors) {
      console.log(`  ${v.name} (${v.status}): /vendor/dbaf26-demo?token=${v.vendorToken}`);
    }
  }

  console.log(`\nDBaf26 seeded successfully!`);
  console.log(`  - 25 sample vendors (13 approved, 8 applied, 2 waitlisted, 2 emergent students)`);
  console.log(`  - 6 info sections filled with real DBAF data`);
  console.log(`  - Vendor portal enabled (invite link: /vendor/dbaf26-demo)`);
  console.log(`  - Pricing: Juried $250, Non-Juried $175, Emergent $75`);
  console.log(`  - Adjacency rules for: Painting, Jewelry, Photography, Glass Art, Sculpture`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
