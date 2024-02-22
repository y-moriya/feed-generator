import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import * as fs from 'fs';

const targetsOneWord = JSON.parse(fs.readFileSync('resources/targetsOneWord.json', 'utf-8'));
const targetsMultiWord = JSON.parse(fs.readFileSync('resources/targetsMultiWord.json', 'utf-8'));
const targetWord = "阪神";

function includesAny(text: string, targetsOneWord: string[]): boolean {
  return targetsOneWord.some((target) => text.includes(target));
}

function includesMulti(text: string, targetsMultiWord: string[], targetWord: string): boolean {
  if (!text.includes(targetWord)) return false;
  return includesAny(text, targetsMultiWord);
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    for (const post of ops.posts.creates) {
      if (includesAny(post.record.text, targetsOneWord) ||
        includesMulti(post.record.text, targetsMultiWord, targetWord)) {
        console.log(post.record.text)
      }
    }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only tigers-related posts
        return includesAny(create.record.text, targetsOneWord) ||
          includesMulti(create.record.text, targetsMultiWord, targetWord)
      })
      .map((create) => {
        // map alf-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
