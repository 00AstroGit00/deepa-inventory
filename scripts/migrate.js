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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
require("dotenv/config");
var pg = require("pg");
var pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var dir, files, _i, files_1, file, version, rowCount, sql, client, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dir = (0, node_path_1.join)(process.cwd(), 'migrations');
                    files = (0, node_fs_1.readdirSync)(dir).filter(function (f) { return f.endsWith('.sql'); }).sort();
                    return [4 /*yield*/, pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (\n    version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")];
                case 1:
                    _a.sent();
                    _i = 0, files_1 = files;
                    _a.label = 2;
                case 2:
                    if (!(_i < files_1.length)) return [3 /*break*/, 14];
                    file = files_1[_i];
                    version = file.replace(/\.sql$/, '');
                    return [4 /*yield*/, pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version])];
                case 3:
                    rowCount = (_a.sent()).rowCount;
                    if (rowCount) {
                        console.log("skip  ".concat(version));
                        return [3 /*break*/, 13];
                    }
                    sql = (0, node_fs_1.readFileSync)((0, node_path_1.join)(dir, file), 'utf8');
                    return [4 /*yield*/, pool.connect()];
                case 4:
                    client = _a.sent();
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 10, 12, 13]);
                    return [4 /*yield*/, client.query('BEGIN')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, client.query(sql)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version])];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, client.query('COMMIT')];
                case 9:
                    _a.sent();
                    console.log("apply ".concat(version));
                    return [3 /*break*/, 13];
                case 10:
                    e_1 = _a.sent();
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 11:
                    _a.sent();
                    console.error("FAIL  ".concat(version), e_1);
                    process.exit(1);
                    return [3 /*break*/, 13];
                case 12:
                    client.release();
                    return [7 /*endfinally*/];
                case 13:
                    _i++;
                    return [3 /*break*/, 2];
                case 14: return [4 /*yield*/, pool.end()];
                case 15:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
