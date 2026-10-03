import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './modules/auth/auth.service';
import { VocabularyService } from './modules/vocabulary/vocabulary.service';
import { ProgressService } from './modules/progress/progress.service';
import { UsersService } from './modules/users/users.service';
import { LessonsService } from './modules/lessons/lessons.service';
import * as dns from 'dns';

if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

async function runIsolationTest() {
  console.log('🚀 Starting Data Isolation Verification Test for WriteDuo...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  const authService = app.get(AuthService);
  const vocabService = app.get(VocabularyService);
  const progressService = app.get(ProgressService);
  const usersService = app.get(UsersService);
  const lessonsService = app.get(LessonsService);

  const emailA = 'test-a@example.com';
  const emailB = 'test-b@example.com';
  const password = 'Password123!';

  console.log('\n--- STEP 1: Register or Login User A & User B ---');
  let tokenA: string;
  let userAId: string;
  try {
    const resA = await authService.register({ email: emailA, password, name: 'Learner A' });
    tokenA = resA.token;
    userAId = resA.user.id.toString();
    console.log(`✅ User A registered with ID: ${userAId}`);
  } catch (err: any) {
    const loginA = await authService.login({ email: emailA, password });
    tokenA = loginA.token;
    userAId = loginA.user.id.toString();
    console.log(`ℹ️ User A already exists, logged in with ID: ${userAId}`);
  }

  let tokenB: string;
  let userBId: string;
  try {
    const resB = await authService.register({ email: emailB, password, name: 'Learner B' });
    tokenB = resB.token;
    userBId = resB.user.id.toString();
    console.log(`✅ User B registered with ID: ${userBId}`);
  } catch (err: any) {
    const loginB = await authService.login({ email: emailB, password });
    tokenB = loginB.token;
    userBId = loginB.user.id.toString();
    console.log(`ℹ️ User B already exists, logged in with ID: ${userBId}`);
  }

  console.log('\n--- STEP 2: USER A Performs Learning Activities ---');
  // 1. User A saves 3 words
  await vocabService.saveWord(userAId, { word: 'resilient', meaningVi: 'kiên cường', pos: 'adj', cefr: 'B2' });
  await vocabService.saveWord(userAId, { word: 'eloquent', meaningVi: 'hùng biện', pos: 'adj', cefr: 'C1' });
  await vocabService.saveWord(userAId, { word: 'ubiquitous', meaningVi: 'phổ biến khắp nơi', pos: 'adj', cefr: 'C1' });
  console.log('✅ User A saved 3 words: resilient, eloquent, ubiquitous');

  // 2. User A makes mistakes on 2 words
  await vocabService.recordWordAttempt(userAId, 'although', false, 'Although it rained, we went out.');
  await vocabService.recordWordAttempt(userAId, 'although', false, 'Although it was hard, he succeeded.');
  await vocabService.recordWordAttempt(userAId, 'accommodate', false, 'The hotel can accommodate 500 guests.');
  console.log('✅ User A recorded mistakes on 2 words: although (2 errors), accommodate (1 error)');

  // 3. User A completes a lesson and earns XP + streak
  const lessons = await lessonsService.getAllLessons();
  if (lessons.length > 0) {
    const lesson = lessons[0];
    await progressService.completeLesson(userAId, lesson._id.toString(), 95);
    console.log(`✅ User A completed lesson "${lesson.title}" and earned bonus XP`);
  }

  // Check User A's stats
  const statsA = await usersService.getMe(userAId);
  const vocabA = await vocabService.getVocabularyList(userAId);
  const weakA = await vocabService.getWeakVocabulary(userAId);

  console.log('\n📊 USER A Summary:');
  console.log(`- XP: ${statsA.xp}`);
  console.log(`- Streak: ${statsA.streak}`);
  console.log(`- Saved words count: ${statsA.savedWordsCount} (items in list: ${vocabA.totalCount})`);
  console.log(`- Weak words count: ${statsA.weakWordsCount} (items in list: ${weakA.length})`);
  console.log(`- Completed lessons count: ${statsA.completedLessonsCount}`);

  console.log('\n--- STEP 3: Switch To USER B (Verify Complete Isolation) ---');
  const statsB = await usersService.getMe(userBId);
  const vocabB = await vocabService.getVocabularyList(userBId);
  const weakB = await vocabService.getWeakVocabulary(userBId);

  console.log('\n📊 USER B Summary:');
  console.log(`- XP: ${statsB.xp}`);
  console.log(`- Streak: ${statsB.streak}`);
  console.log(`- Saved words count: ${statsB.savedWordsCount} (items in list: ${vocabB.totalCount})`);
  console.log(`- Weak words count: ${statsB.weakWordsCount} (items in list: ${weakB.length})`);
  console.log(`- Completed lessons count: ${statsB.completedLessonsCount}`);

  // Assertions
  const savedWordsBMatchesA = vocabB.items.some((w) => ['resilient', 'eloquent', 'ubiquitous'].includes(w.word));
  const weakWordsBMatchesA = weakB.some((w) => ['although', 'accommodate'].includes(w.word));

  console.log('\n--- STEP 4: ISOLATION VERIFICATION CHECKS ---');
  if (savedWordsBMatchesA) {
    console.error('❌ LEAK DETECTED: User B can see User A saved words!');
    process.exit(1);
  } else {
    console.log('✅ PASS: User B has 0 of User A saved words.');
  }

  if (weakWordsBMatchesA) {
    console.error('❌ LEAK DETECTED: User B can see User A weak words!');
    process.exit(1);
  } else {
    console.log('✅ PASS: User B has 0 of User A weak words.');
  }

  if (statsB.xp === statsA.xp && statsA.xp > 0) {
    console.error('❌ LEAK DETECTED: User B has identical XP to User A!');
    process.exit(1);
  } else {
    console.log(`✅ PASS: User B XP (${statsB.xp}) is completely isolated from User A XP (${statsA.xp}).`);
  }

  // Now User B saves 1 word of their own
  await vocabService.saveWord(userBId, { word: 'serendipity', meaningVi: 'sự tình cờ may mắn', pos: 'noun', cefr: 'C2' });
  const vocabBAfter = await vocabService.getVocabularyList(userBId);
  const vocabAAfter = await vocabService.getVocabularyList(userAId);

  const userASeesUserBWord = vocabAAfter.items.some((w) => w.word === 'serendipity');
  if (userASeesUserBWord) {
    console.error('❌ LEAK DETECTED: User A can see User B word "serendipity"!');
    process.exit(1);
  } else {
    console.log('✅ PASS: User A does NOT see User B word "serendipity".');
  }

  console.log('\n🎉 ALL DATA ISOLATION TESTS PASSED 100%! DATA IS STRICTLY PARTITIONED BY USER ID.');
  await app.close();
  process.exit(0);
}

runIsolationTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
