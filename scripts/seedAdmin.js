const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns set not supported
}
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();
const User = require('../models/User');

const seedAdmin = async () => {
  // Command-line args fallback: node seedAdmin.js <email> <password> <name>
  const args = process.argv.slice(2);
  const adminEmail = args[0] || process.env.ADMIN_EMAIL || 'admin@campus.edu';
  const adminPassword = args[1] || process.env.ADMIN_PASSWORD || 'CampusAdmin@2026';
  const adminName = args[2] || process.env.ADMIN_NAME || 'Chief Campus Administrator';
  const adminDept = args[3] || process.env.ADMIN_DEPT || 'Campus Administration & Dean Office';

  if (!process.env.MONGO_URI) {
    console.error('❌ Error: MONGO_URI is not defined in environment variables.');
    console.error('Please configure your backend/.env file before running this script.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      console.log(`ℹ️ User with email "${normalizedEmail}" already exists.`);
      existingAdmin.role = 'admin';
      existingAdmin.name = adminName;
      existingAdmin.department = adminDept;
      existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
      await existingAdmin.save();
      console.log(`🎉 User "${normalizedEmail}" has been upgraded to Administrator role!`);
    } else {
      await User.create({
        name: adminName,
        email: normalizedEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: 'admin',
        department: adminDept,
        studentId: 'ADMIN-001',
      });
      console.log(`🎉 Administrator account created successfully!`);
      console.log(`👤 Name: ${adminName}`);
      console.log(`📧 Email: ${normalizedEmail}`);
      console.log(`🛡️ Role: admin`);
    }

    // Also seed a Faculty / Department In-charge account
    const facultyEmail = 'faculty@campus.edu';
    const facultyPassword = 'Faculty@2026';
    const existingFaculty = await User.findOne({ email: facultyEmail });
    if (!existingFaculty) {
      await User.create({
        name: 'Prof. Eleanor Vance (Faculty HOD)',
        email: facultyEmail,
        password: facultyPassword,
        role: 'admin',
        department: 'Academic & Faculty Affairs',
        studentId: 'FACULTY-001',
      });
      console.log(`🎉 Faculty / Dept In-Charge account created successfully!`);
      console.log(`👤 Name: Prof. Eleanor Vance (Faculty HOD)`);
      console.log(`📧 Email: ${facultyEmail}`);
      console.log(`🛡️ Role: admin`);
    } else {
      existingFaculty.role = 'admin';
      existingFaculty.password = facultyPassword;
      await existingFaculty.save();
      console.log(`🎉 Faculty user "${facultyEmail}" updated successfully!`);
    }

    console.log('🔒 Security Notice: Public registration never permits admin/faculty creation.');
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding administrator:', error.message);
    process.exit(1);
  }
};

seedAdmin();
