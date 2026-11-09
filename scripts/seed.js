"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var pg = require("pg");
var bcrypt = require("bcryptjs");
var pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var email, password, hash, products, _i, products_1, _a, name_1, brand, category, unit, pkg, bottle, tax, reorder;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    email = (_b = process.env.SEED_ADMIN_EMAIL) !== null && _b !== void 0 ? _b : 'admin@deepa.local';
                    password = (_c = process.env.SEED_ADMIN_PASSWORD) !== null && _c !== void 0 ? _c : 'ChangeMe-Immediately-1';
                    return [4 /*yield*/, bcrypt.hash(password, 12)];
                case 1:
                    hash = _d.sent();
                    return [4 /*yield*/, pool.query("INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'admin')\n     ON CONFLICT (email) DO NOTHING", [email, hash])];
                case 2:
                    _d.sent();
                    products = [
                        ['McDowell No.1 Whisky 750ml', 'McDowell', 'liquor', 'ml', 750, 750, 'outside_gst_excise_vat', 6],
                        ['Royal Challenge Whisky 750ml', 'Royal Challenge', 'liquor', 'ml', 750, 750, 'outside_gst_excise_vat', 6],
                        ['Old Monk Rum 750ml', 'Old Monk', 'liquor', 'ml', 750, 750, 'outside_gst_excise_vat', 4],
                        ['Kingfisher Lager 650ml', 'Kingfisher', 'beer', 'bottle', 650, null, 'outside_gst_excise_vat', 24],
                        ['Kingfisher Draught 330ml Tin', 'Kingfisher', 'beer', 'tin', 330, null, 'outside_gst_excise_vat', 24],
                        ['Coca-Cola 300ml', 'Coca-Cola', 'soda', 'bottle', 300, null, 'gst_28_cess', 12],
                        ['Club Soda 750ml', 'Generic', 'club_soda', 'bottle', 750, null, 'gst_18', 12],
                        ['Bisleri Mineral Water 1000ml', 'Bisleri', 'water', 'bottle', 1000, null, 'gst_18', 24],
                    ];
                    _i = 0, products_1 = products;
                    _d.label = 3;
                case 3:
                    if (!(_i < products_1.length)) return [3 /*break*/, 6];
                    _a = products_1[_i], name_1 = _a[0], brand = _a[1], category = _a[2], unit = _a[3], pkg = _a[4], bottle = _a[5], tax = _a[6], reorder = _a[7];
                    return [4 /*yield*/, pool.query("INSERT INTO products\n        (name, brand, category, stock_unit, package_size_amount, package_size_unit,\n         bottle_size_ml, tax_treatment, reorder_level)\n       VALUES ($1,$2,$3,$4,$5,'ml',$6,$7,$8)\n       ON CONFLICT (name, brand, category, stock_unit) DO NOTHING", [name_1, brand, category, unit, pkg, bottle, tax, reorder])];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('Seed complete. Login:', email);
                    return [4 /*yield*/, pool.end()];
                case 7:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
