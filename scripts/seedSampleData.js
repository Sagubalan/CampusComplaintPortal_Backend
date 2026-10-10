const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const User = require('../models/User');
const Complaint = require('../models/Complaint');

const seedData = async () => {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_complaints';

  try {
    console.log('🔄 Connecting to MongoDB database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Seed or update Administrator
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campus.edu').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'CampusAdmin@2026';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'Chief Campus Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        studentId: 'ADMIN-001',
        department: 'Campus Administration & Student Affairs',
        phone: '+1 555-010-0001',
      });
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅ Admin updated: ${adminEmail}`);
    }

    // 2. Sample Students
    const studentsData = [
      {
        name: 'Alex Vance',
        email: 'alex.vance@campus.edu',
        password: 'Student@2026',
        studentId: 'STU-2024-001',
        department: 'Computer Science & Engineering',
        phone: '+1 555-019-2001',
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@campus.edu',
        password: 'Student@2026',
        studentId: 'STU-2024-042',
        department: 'Electronics & Communication Engineering',
        phone: '+1 555-019-2042',
      },
      {
        name: 'Marcus Chen',
        email: 'marcus.chen@campus.edu',
        password: 'Student@2026',
        studentId: 'STU-2024-118',
        department: 'Mechanical Engineering',
        phone: '+1 555-019-2118',
      },
    ];

    const studentDocs = [];
    for (const s of studentsData) {
      let stu = await User.findOne({ email: s.email });
      if (!stu) {
        stu = await User.create({
          ...s,
          role: 'student',
        });
        console.log(`✅ Student created: ${s.email}`);
      } else {
        stu.password = s.password;
        await stu.save();
        console.log(`✅ Student updated: ${s.email}`);
      }
      studentDocs.push(stu);
    }

    // 3. Create Sample Complaints if collection is empty or sparse
    const existingComplaintsCount = await Complaint.countDocuments();
    if (existingComplaintsCount === 0) {
      console.log('🔄 Creating sample complaints for demonstration...');

      const sampleComplaints = [
        {
          ticketId: 'CMP-104921-2041',
          title: 'Water geyser leakage in Room 204 washroom',
          description:
            'The central water geyser in Hostel Block A, 2nd-floor common washroom has a persistent leakage causing slippery flooring and low hot water pressure in mornings.',
          category: 'Hostel',
          priority: 'High',
          locationZone: 'Hostel Block A (Men)',
          locationDetails: 'Room 204 & 2nd Floor East Washroom',
          status: 'In Progress',
          student: studentDocs[0]._id,
          assignedDepartment: 'Hostel Warden & Office',
          assignedOfficer: 'Supervisor Dave Miller',
          resolutionRemarks: 'Plumber inspected on-site. Valve replacement ordered.',
          statusHistory: [
            {
              status: 'Pending',
              remarks: 'Complaint registered successfully by student.',
              updatedBy: studentDocs[0]._id,
              updatedByName: studentDocs[0].name,
              updatedAt: new Date(Date.now() - 36 * 3600 * 1000),
            },
            {
              status: 'In Progress',
              remarks: 'Assigned to Hostel Maintenance. Plumber inspecting unit.',
              updatedBy: admin._id,
              updatedByName: admin.name,
              updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
            },
          ],
        },
        {
          ticketId: 'CMP-105183-4819',
          title: 'Projector flickering & HDMI port damaged in Lab 3',
          description:
            'The ceiling overhead projector in Advanced Computing Lab 3 flickers continuously every 2 minutes. The HDMI extension socket on the instructor desk has loose connection.',
          category: 'Academic',
          priority: 'Medium',
          locationZone: 'Main Academic Block 1',
          locationDetails: 'Lab 3, Ground Floor West Wing',
          status: 'Resolved',
          student: studentDocs[1]._id,
          assignedDepartment: 'Campus IT & Network Ops',
          assignedOfficer: 'Tech Lead Priya Nair',
          resolutionRemarks:
            'Replaced frayed HDMI cable run and adjusted projector refresh rate. Verified functional.',
          statusHistory: [
            {
              status: 'Pending',
              remarks: 'Complaint registered by student.',
              updatedBy: studentDocs[1]._id,
              updatedByName: studentDocs[1].name,
              updatedAt: new Date(Date.now() - 48 * 3600 * 1000),
            },
            {
              status: 'In Progress',
              remarks: 'IT Field Tech dispatched to Lab 3.',
              updatedBy: admin._id,
              updatedByName: admin.name,
              updatedAt: new Date(Date.now() - 24 * 3600 * 1000),
            },
            {
              status: 'Resolved',
              remarks: 'Replaced HDMI cable run and secured projector mount.',
              updatedBy: admin._id,
              updatedByName: admin.name,
              updatedAt: new Date(Date.now() - 4 * 3600 * 1000),
            },
          ],
        },
        {
          ticketId: 'CMP-106412-8821',
          title: 'Drinking water dispenser filter indicator flashing red',
          description:
            'The UV water purifier on the 3rd floor of the Science Wing indicates filter expiration. Flow rate has dropped significantly.',
          category: 'Sanitation',
          priority: 'Urgent',
          locationZone: 'Science & Technology Wing',
          locationDetails: '3rd Floor Hallway next to Room 318',
          status: 'Pending',
          student: studentDocs[2]._id,
          assignedDepartment: 'Sanitation & Housekeeping',
          assignedOfficer: 'Unassigned',
          statusHistory: [
            {
              status: 'Pending',
              remarks: 'Grievance submitted by student. Awaiting admin review.',
              updatedBy: studentDocs[2]._id,
              updatedByName: studentDocs[2].name,
              updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
            },
          ],
        },
        {
          ticketId: 'CMP-107009-3190',
          title: 'Mess food reheating station non-functional during dinner',
          description:
            'The induction warmers in the South Dining counter are not holding temperature, causing food to turn cold quickly.',
          category: 'Mess & Canteen',
          priority: 'Medium',
          locationZone: 'Student Dining & Mess Hall',
          locationDetails: 'Dining Hall 2, Counter B',
          status: 'In Progress',
          student: studentDocs[0]._id,
          assignedDepartment: 'Food Safety & Mess Committee',
          assignedOfficer: 'Mess Manager K. Raman',
          resolutionRemarks: 'Electrical technician checking power breaker.',
          statusHistory: [
            {
              status: 'Pending',
              remarks: 'Complaint registered.',
              updatedBy: studentDocs[0]._id,
              updatedByName: studentDocs[0].name,
              updatedAt: new Date(Date.now() - 18 * 3600 * 1000),
            },
            {
              status: 'In Progress',
              remarks: 'Mess vendor contacted to service warmers.',
              updatedBy: admin._id,
              updatedByName: admin.name,
              updatedAt: new Date(Date.now() - 6 * 3600 * 1000),
            },
          ],
        },
      ];

      for (const comp of sampleComplaints) {
        await Complaint.create(comp);
      }
      console.log('✅ Created 4 sample complaints with full audit trails.');
    } else {
      console.log(`ℹ️ Database already has ${existingComplaintsCount} complaints. Skipping complaint creation.`);
    }

    console.log('\n=============================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
};

seedData();
