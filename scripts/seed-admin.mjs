import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rimalwearhouse';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    pin: { type: String },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'CASHIER'], default: 'CASHIER' },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const existingAdmin = await User.findOne({ email: 'admin@rimal.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const newAdmin = new User({
      name: 'Super Admin',
      email: 'admin@rimal.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    });

    await newAdmin.save();
    console.log('Admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seed();
