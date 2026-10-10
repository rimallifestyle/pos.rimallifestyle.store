import mongoose from 'mongoose';

async function fixSales() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wearhouse_pos');
  const db = mongoose.connection.db;

  const outlet = await db.collection('outlets').findOne({ name: /Mirpur/i });
  if (outlet) {
    const res = await db.collection('sales').updateMany(
      { outletId: null },
      { $set: { outletId: outlet._id } }
    );
    console.log(`Updated ${res.modifiedCount} sales to outlet ${outlet.name}`);
  } else {
    console.log("Mirpur outlet not found");
  }
  process.exit(0);
}

fixSales();
