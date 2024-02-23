import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import * as fs from 'fs';

const targetsOneWord = JSON.parse(fs.readFileSync('./static/targetsOneWord.json', 'utf-8'));
const targetsMultiWord = JSON.parse(fs.readFileSync('./static/targetsMultiWord.json', 'utf-8'));
const ngWords = JSON.parse(fs.readFileSync('./static/ngWords.json', 'utf-8'));
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

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // only tigers-related posts
        if (includesAny(create.record.text, ngWords)) return false;
        return includesAny(create.record.text, targetsOneWord) ||
          includesMulti(create.record.text, targetsMultiWord, targetWord)
      })
      .map((create) => {
        // map alf-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          text: create.record.text,
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
