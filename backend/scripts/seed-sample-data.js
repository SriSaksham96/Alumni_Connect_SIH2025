const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Event = require('../models/Event');
const News = require('../models/News');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const SwapOffer = require('../models/SwapOffer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect';

async function connectDb() {
	await mongoose.connect(MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
}

function randomFrom(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function purgeData() {
	console.log('Purging existing sample data...');
	// Keep admins and super_admins. Remove alumni and students only.
	await User.deleteMany({ role: { $in: ['alumni', 'student'] } });
	await Event.deleteMany({});
	await News.deleteMany({});
	await Donation.deleteMany({});
	await Campaign.deleteMany({});
	await SwapOffer.deleteMany({});
	console.log('Purge complete.');
}

async function seedUsers() {
	console.log('Seeding alumni and students...');
	const skillsPool = ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'Go', 'Kubernetes', 'Marketing', 'Design', 'Finance'];
	const interestsPool = ['AI', 'Startups', 'Web3', 'Fintech', 'EdTech', 'SaaS', 'Open Source'];
	const specialtiesPool = ['career-guidance', 'skill-development', 'networking', 'industry-insights', 'resume-review', 'interview-prep'];

	const alumniPromises = Array.from({ length: 8 }).map((_, i) => {
		const firstName = `Alumni${i + 1}`;
		const lastName = `User`;
		return new User({
			firstName,
			lastName,
			email: `alumni${i + 1}@example.com`,
			password: 'password123',
			role: 'alumni',
			status: 'active',
			profile: {
				bio: `I am ${firstName} ${lastName}, passionate about ${randomFrom(interestsPool)}.`,
				graduationYear: randomInt(2005, 2022),
				degree: randomFrom(['B.Tech', 'M.Tech', 'MBA', 'BSc', 'MSc']),
				major: randomFrom(['Computer Science', 'Electronics', 'Mechanical', 'Business', 'Mathematics']),
				currentJob: randomFrom(['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'Marketer']),
				company: randomFrom(['Google', 'Microsoft', 'Amazon', 'Meta', 'Stripe', 'Startup Inc.']),
				location: { city: randomFrom(['Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Mumbai']), state: 'IN', country: 'India' },
				skills: Array.from({ length: 3 }).map(() => randomFrom(skillsPool)),
				interests: Array.from({ length: 2 }).map(() => randomFrom(interestsPool)),
				mentorship: {
					isAvailableAsMentor: i % 2 === 0,
					mentorBio: 'Happy to mentor students and junior alumni.',
					mentorSpecialties: Array.from({ length: 2 }).map(() => randomFrom(specialtiesPool)),
					mentorExperience: randomFrom(['0-2 years', '2-5 years', '5-10 years', '10+ years']),
					maxMentees: randomInt(2, 5),
					currentMentees: 0,
					preferredMeetingFrequency: randomFrom(['weekly', 'bi-weekly', 'monthly']),
					preferredCommunicationMethod: randomFrom(['email', 'phone', 'video-call', 'mixed']),
					mentorRating: randomInt(0, 5),
					totalMentorshipSessions: randomInt(0, 20)
				},
				swap: {
					isAvailableForSwaps: i % 2 === 1,
					swapBio: 'Open to swapping skills, services, and accommodation.',
					swapPreferences: {
						preferredCategories: ['skill', 'service', 'accommodation'],
						maxDistance: 100,
						preferredCommunication: 'mixed'
					},
					swapStats: {
						totalOffers: 0,
						totalRequests: 0,
						totalCompleted: randomInt(0, 5),
						averageRating: randomInt(0, 5),
						totalRatings: randomInt(0, 20)
					}
				}
			}
		});
	});

	const studentsPromises = Array.from({ length: 5 }).map((_, i) => new User({
		firstName: `Student${i + 1}`,
		lastName: 'User',
		email: `student${i + 1}@example.com`,
		password: 'password123',
		role: 'student',
		status: 'active',
		profile: {
			bio: 'Student eager to learn and collaborate.',
			graduationYear: randomInt(2025, 2028),
			degree: 'B.Tech',
			major: randomFrom(['Computer Science', 'Electronics', 'Mechanical']),
			location: { city: randomFrom(['Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Mumbai']), state: 'IN', country: 'India' },
			skills: Array.from({ length: 2 }).map(() => randomFrom(skillsPool)),
			interests: Array.from({ length: 2 }).map(() => randomFrom(interestsPool))
		}
	}));

	const users = await User.insertMany([...(await Promise.all(alumniPromises)), ...(await Promise.all(studentsPromises))]);
	console.log(`Inserted users: ${users.length}`);
	return users;
}

async function seedSwapOffers(users) {
	console.log('Seeding swap offers...');
	const owners = users.filter(u => u.role === 'alumni' && u.profile?.swap?.isAvailableForSwaps);
	const categories = ['skill', 'service', 'accommodation'];
	const offers = [];
	owners.slice(0, 6).forEach((owner, idx) => {
		const category = randomFrom(categories);
		offers.push(new SwapOffer({
			user: owner._id,
			title: category === 'accommodation' ? 'City Center Apartment Stay' : 'Offer my expertise',
			description: 'High-quality exchange for motivated peers. Flexible on timing.',
			category,
			subcategory: category === 'skill' ? randomFrom(['Frontend', 'Backend', 'Data']) : category === 'service' ? randomFrom(['Mentoring', 'Consulting']) : randomFrom(['Apartment', 'House', 'Room']),
			tags: ['alumni', 'swap', 'community'],
			location: {
				type: 'Point',
				coordinates: [77.5946 + Math.random() * 0.1, 12.9716 + Math.random() * 0.1],
				address: { city: randomFrom(['Bengaluru', 'Pune', 'Hyderabad']), state: 'IN', country: 'India' }
			},
			locationRequired: category === 'accommodation',
			availability: {
				startDate: new Date(Date.now() + 7 * 86400000),
				endDate: new Date(Date.now() + 60 * 86400000),
				timeSlots: [{ day: 'saturday', startTime: '10:00', endTime: '12:00', timezone: 'IST' }],
				isRecurring: true
			},
			accommodation: category === 'accommodation' ? {
				propertyType: randomFrom(['apartment', 'house', 'room']),
				bedrooms: randomInt(1, 3),
				bathrooms: randomInt(1, 2),
				maxGuests: randomInt(1, 4),
				amenities: ['wifi', 'kitchen', 'workspace'],
				houseRules: ['no-smoking'],
				checkInTime: '14:00',
				checkOutTime: '11:00',
				minimumStay: 2,
				maximumStay: 14,
				smokingAllowed: false,
				petsAllowed: false
			} : undefined,
			wantsInReturn: category === 'accommodation' ? 'Looking for a weekend mentoring or design help' : 'Marketing help or short accommodation stay',
			preferredCategories: ['service', 'accommodation'],
			estimatedValue: { amount: randomInt(50, 500), currency: 'USD', isFlexible: true },
			skillLevel: randomFrom(['beginner', 'intermediate', 'advanced', 'expert']),
			experience: '5+ years',
			status: 'active',
			isPublic: true
		}));
	});

	const inserted = await SwapOffer.insertMany(offers);
	console.log(`Inserted swap offers: ${inserted.length}`);
}

async function seedEventsNewsDonations(users) {
	console.log('Seeding events, news, campaigns, and donations...');
	const organizers = users.filter(u => u.role === 'alumni').slice(0, 4);

	// Events
	const eventDocs = await Event.insertMany(Array.from({ length: 5 }).map((_, i) => ({
		title: `Alumni Meetup #${i + 1}`,
		description: 'Networking and knowledge sharing among alumni.',
		date: new Date(Date.now() + (i + 3) * 86400000),
		location: { venue: 'Auditorium', city: 'Bengaluru', state: 'KA', country: 'India' },
		eventType: 'networking',
		organizer: randomFrom(organizers)?._id,
		capacity: randomInt(50, 200),
		status: 'published',
		isPublic: true
	})));

	// News
	const newsDocs = await News.insertMany(Array.from({ length: 5 }).map((_, i) => ({
		title: `Alumni Success Story ${i + 1}`,
		content: 'Our alumni continue to achieve remarkable milestones across industries.',
		category: 'general',
		author: randomFrom(organizers)?._id,
		status: 'published',
		isPublic: true,
		publishDate: new Date(Date.now() - i * 86400000)
	})));

	// Campaigns
	const campaignDocs = await Campaign.insertMany(Array.from({ length: 3 }).map((_, i) => ({
		title: `Support Student Scholarships ${i + 1}`,
		description: 'Raising funds to support meritorious students.',
		shortDescription: 'Help fund scholarships for deserving students.',
		organizer: randomFrom(organizers)?._id,
		targetAmount: 10000 * (i + 1),
		currentAmount: randomInt(0, 3000),
		currency: 'USD',
		startDate: new Date(Date.now() - 7 * 86400000),
		endDate: new Date(Date.now() + 30 * 86400000),
		category: 'general',
		status: 'active'
	})));

	// Donations
	await Donation.insertMany(Array.from({ length: 10 }).map((_, i) => ({
		donor: randomFrom(organizers)?._id,
		campaign: randomFrom(campaignDocs)?._id,
		amount: randomInt(50, 500),
		currency: 'USD',
		purpose: 'general',
		paymentMethod: randomFrom(['credit_card', 'paypal', 'bank_transfer']),
		paymentStatus: 'completed',
		transactionId: `TXN-${Date.now()}-${i}`,
		paymentGateway: randomFrom(['stripe', 'paypal'])
	})));

	console.log(`Inserted events: ${eventDocs.length}, news: ${newsDocs.length}, campaigns: ${campaignDocs.length}, donations: 10`);
}

async function main() {
	try {
		console.log('Connecting to MongoDB...');
		await connectDb();
		console.log('Connected.');

		await purgeData();
		const users = await seedUsers();
		await seedSwapOffers(users);
		await seedEventsNewsDonations(users);

		console.log('✅ Sample data seeded successfully.');
	} catch (err) {
		console.error('❌ Seeding failed:', err);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
}

main();
