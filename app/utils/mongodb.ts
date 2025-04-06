import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("環境変数MONGODB_URIが設定されていません");
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let db: Db;

if (process.env.NODE_ENV === "development") {
  // 開発環境ではグローバル変数を使用してホットリロード時の複数接続を防ぐ
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoDb?: Db;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    globalWithMongo._mongoDb = client.db("catask");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
  db = globalWithMongo._mongoDb!;
} else {
  // 本番環境では毎回新しい接続を作成
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  db = client.db("catask");
}

// MongoDBデータベースへのエクスポート
export { clientPromise, db };

// コレクションの取得
export const getCollection = (name: string) => db.collection(name);
