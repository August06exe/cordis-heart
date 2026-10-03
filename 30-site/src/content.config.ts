import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 内容管线：九页文稿从 30-site/content/*.md 迁入 src/content/pages/。
 * schema 对齐文稿现有 frontmatter（title / slug / badges 三字段，九份文稿字段一致，
 * 逐份核对过 frontmatter，见任务记录）；badges 是自由文本（含计数与行内标注说明），不做枚举。
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    badges: z.string(),
  }),
});

export const collections = { pages };
