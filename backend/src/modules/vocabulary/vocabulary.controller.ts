import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { SaveVocabDto } from './dto/save-vocab.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabService: VocabularyService) {}

  // 1. Get saved words (Supports /vocabulary and /vocabulary/saved)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getVocabulary(
    @CurrentUser('userId') userId: string,
    @Query('q') query?: string,
    @Query('cefr') cefr?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);
    const data = await this.vocabService.getVocabularyList(userId, query, cefr, pageNum, limitNum);
    return {
      success: true,
      data,
    };
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async getSavedVocabulary(
    @CurrentUser('userId') userId: string,
    @Query('q') query?: string,
    @Query('cefr') cefr?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getVocabulary(userId, query, cefr, page, limit);
  }

  // 2. Check if a word is already saved by current user
  @Get('check/:word')
  @UseGuards(JwtAuthGuard)
  async checkWordSaved(
    @CurrentUser('userId') userId: string,
    @Param('word') word: string,
  ) {
    const data = await this.vocabService.checkWordSaved(userId, word);
    return {
      success: true,
      data,
    };
  }

  // 3. Get weak vocabulary list for current user
  @Get('weak')
  @UseGuards(JwtAuthGuard)
  async getWeakVocabulary(@CurrentUser('userId') userId: string) {
    const data = await this.vocabService.getWeakVocabulary(userId);
    return {
      success: true,
      data,
    };
  }

  // 4. Public lookup dictionary
  @Get('lookup')
  async lookupWord(
    @Query('word') word: string,
    @Query('context') context?: string,
  ) {
    const result = await this.vocabService.lookupWord(word, context);
    return {
      success: true,
      data: result,
    };
  }

  // 5. Save word for current user (supports /save and /saved)
  @Post('save')
  @UseGuards(JwtAuthGuard)
  async saveWord(@CurrentUser('userId') userId: string, @Body() dto: SaveVocabDto) {
    const result = await this.vocabService.saveWord(userId, dto);
    return {
      success: true,
      data: result,
      message: 'Đã lưu từ vựng vào sổ tay.',
    };
  }

  @Post('saved')
  @UseGuards(JwtAuthGuard)
  async saveWordAlias(@CurrentUser('userId') userId: string, @Body() dto: SaveVocabDto) {
    return this.saveWord(userId, dto);
  }

  // 6. Toggle favorite
  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  async toggleFavorite(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.vocabService.toggleFavorite(userId, id);
    return {
      success: true,
      data: result,
    };
  }

  // 7. Delete saved word (supports /:id and /saved/:id)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteWord(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.vocabService.deleteWord(userId, id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('saved/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSavedWord(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.deleteWord(userId, id);
  }
}
