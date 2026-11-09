import 'dotenv/config';
import * as pg from 'pg';
import bcryptjs from 'bcryptjs';
const bcrypt = (bcryptjs as any).default || bcryptjs;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@deepa.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe-Immediately-1';
  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'admin')
     ON CONFLICT (email) DO NOTHING`, [email, hash]);

  const products = [
    ['McDowell No.1 Whisky 750ml','McDowell','liquor','ml',750,750,'outside_gst_excise_vat',6],
    ['Royal Challenge Whisky 750ml','Royal Challenge','liquor','ml',750,750,'outside_gst_excise_vat',6],
    ['Old Monk Rum 750ml','Old Monk','liquor','ml',750,750,'outside_gst_excise_vat',4],
    ['Kingfisher Lager 650ml','Kingfisher','beer','bottle',650,null,'outside_gst_excise_vat',24],
    ['Kingfisher Draught 330ml Tin','Kingfisher','beer','tin',330,null,'outside_gst_excise_vat',24],
    ['Coca-Cola 300ml','Coca-Cola','soda','bottle',300,null,'gst_28_cess',12],
    ['Club Soda 750ml','Generic','club_soda','bottle',750,null,'gst_18',12],
    ['Bisleri Mineral Water 1000ml','Bisleri','water','bottle',1000,null,'gst_18',24],
  ] as const;

  for (const [name, brand, category, unit, pkg, bottle, tax, reorder] of products) {
    await pool.query(
      `INSERT INTO products
        (name, brand, category, stock_unit, package_size_amount, package_size_unit,
         bottle_size_ml, tax_treatment, reorder_level)
       VALUES ($1,$2,$3,$4,$5,'ml',$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [name, brand, category, unit, pkg, bottle, tax, reorder]);
  }
  console.log('Seed complete. Login:', email);
  await pool.end();
}
main();
