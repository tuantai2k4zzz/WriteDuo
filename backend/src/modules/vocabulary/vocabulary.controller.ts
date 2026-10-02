import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { SaveVocabDto } from './dto/save-vocab.dto';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabService: VocabularyService) {}

  @Get()
  async getVocabulary(@Query('q') query?: string, @Query('cefr') cefr?: string) {
    const data = await this.vocabService.getVocabularyList(query, cefr);
    return {
      success: true,
      data,
    };
  }

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

  @Post('save')
  async saveWord(@Body() dto: SaveVocabDto) {
    const result = await this.vocabService.saveWord(dto);
    return {
      success: true,
      data: result,
      message: 'Đã lưu từ vựng vào sổ tay.',
    };
  }

  @Post(':id/favorite')
  async toggleFavorite(@Param('id') id: string) {
    const result = await this.vocabService.toggleFavorite(id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  async deleteWord(@Param('id') id: string) {
    const result = await this.vocabService.deleteWord(id);
    return {
      success: true,
      data: result,
    };
  }
}
