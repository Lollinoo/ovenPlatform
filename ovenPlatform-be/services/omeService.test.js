import { jest } from '@jest/globals';
import * as omeService from './omeService.js';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');

describe('OmeService', () => {
  describe('isStreamNameInUse', () => {
    // Reset mocks between tests
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return true if stream name is already in use', async () => {
      // Setup mock for getActiveStreamNames
      const mockGetActiveStreamNames = jest.spyOn(omeService, 'getActiveStreamNames');
      mockGetActiveStreamNames.mockResolvedValue(['existingStream1', 'ExistingStream2', 'another-stream']);

      // Test with exact match
      expect(await omeService.isStreamNameInUse('existingStream1')).toBe(true);
      
      // Test with case-insensitive match
      expect(await omeService.isStreamNameInUse('existingstream1')).toBe(true);
      expect(await omeService.isStreamNameInUse('EXISTINGSTREAM1')).toBe(true);
      expect(await omeService.isStreamNameInUse('existingStream2')).toBe(true);
      
      // Test with spaces to trim
      expect(await omeService.isStreamNameInUse('  existingStream1  ')).toBe(true);
    });

    test('should return false if stream name is not in use', async () => {
      // Setup mock for getActiveStreamNames
      const mockGetActiveStreamNames = jest.spyOn(omeService, 'getActiveStreamNames');
      mockGetActiveStreamNames.mockResolvedValue(['existingStream1', 'ExistingStream2', 'another-stream']);

      // Test with non-matching names
      expect(await omeService.isStreamNameInUse('newStream')).toBe(false);
      expect(await omeService.isStreamNameInUse('different-stream')).toBe(false);
      expect(await omeService.isStreamNameInUse('not_existing')).toBe(false);
    });

    test('should throw error if stream name is invalid', async () => {
      await expect(omeService.isStreamNameInUse(null)).rejects.toThrow('Invalid stream name');
      await expect(omeService.isStreamNameInUse(undefined)).rejects.toThrow('Invalid stream name');
      await expect(omeService.isStreamNameInUse(123)).rejects.toThrow('Invalid stream name');
      await expect(omeService.isStreamNameInUse({})).rejects.toThrow('Invalid stream name');
    });

    test('should throw if getActiveStreamNames fails', async () => {
      // Setup mock for getActiveStreamNames to throw
      const mockGetActiveStreamNames = jest.spyOn(omeService, 'getActiveStreamNames');
      mockGetActiveStreamNames.mockRejectedValue(new Error('API error'));

      await expect(omeService.isStreamNameInUse('anyStream')).rejects.toThrow('API error');
    });
  });
});
