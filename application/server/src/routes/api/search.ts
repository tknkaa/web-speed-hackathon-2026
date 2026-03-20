import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

function parseNumberQuery(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePagination(query: Record<string, unknown>): {
  limit: number;
  offset: number;
} {
  const limit = parseNumberQuery(query["limit"]);
  const offset = parseNumberQuery(query["offset"]);

  return {
    limit: Math.min(Math.max(limit ?? 20, 1), 50),
    offset: Math.max(offset ?? 0, 0),
  };
}

const NEGATIVE_TERMS = [
  "つらい",
  "辛い",
  "しんどい",
  "悲しい",
  "苦しい",
  "最悪",
  "無理",
  "疲れた",
  "落ち込",
  "不安",
  "いや",
  "嫌",
  "hate",
  "sad",
  "bad",
  "worst",
];

function analyzeSentiment(text: string): {
  score: number;
  label: "positive" | "negative" | "neutral";
} {
  const normalized = text.toLowerCase();
  const negativeHits = NEGATIVE_TERMS.reduce((count, term) => {
    return normalized.includes(term.toLowerCase()) ? count + 1 : count;
  }, 0);

  if (negativeHits === 0) {
    return { score: 0, label: "neutral" };
  }

  const score = Math.min(negativeHits / 5, 1);
  return { score, label: "negative" };
}

searchRouter.get("/search/sentiment", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ score: 0, label: "neutral" });
  }

  const result = analyzeSentiment(query);
  return res.status(200).type("application/json").send(result);
});

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

  // 日付条件を構築
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    limit,
    offset,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      include: [
        {
          association: "user",
          attributes: { exclude: ["profileImageId"] },
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      limit,
      offset,
      where: dateWhere,
    });
  }

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = mergedPosts.slice(offset, offset + limit);

  return res.status(200).type("application/json").send(result);
});
