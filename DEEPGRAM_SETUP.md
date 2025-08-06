# Deepgram Voice UI Enhancement Setup

This document provides step-by-step instructions for setting up the Deepgram voice UI enhancement features in the application.

## Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project set up
2. **Deepgram Account**: Sign up at [deepgram.com](https://deepgram.com) and get your API key
3. **DeepSeek Account**: For translation features (optional but recommended)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

### Required Variables

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# DeepSeek API (Required for translation)
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key

# Deepgram API (Fallback)
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
```

## Database Setup

### 1. Run Migrations

Apply the Deepgram usage tracking migration:

```bash
supabase migration up
```

Or manually run the SQL from:
`supabase/migrations/20250722000000_add_deepgram_usage_tracking.sql`

### 2. Environment Variables in Supabase

In your Supabase dashboard, go to **Settings > Edge Functions** and add:

```
DEEPGRAM_API_KEY=your_deepgram_api_key
```

## Deploy Edge Functions

### 1. Deploy Deepgram Auth Function

```bash
supabase functions deploy deepgram-auth --no-verify-jwt
```

### 2. Deploy Deepgram WebSocket Function

```bash
supabase functions deploy deepgram-websocket --no-verify-jwt
```

### 3. Test Functions

```bash
# Test auth function
curl -X POST \
  https://your-project.supabase.co/functions/v1/deepgram-auth \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_token"}'

# Test usage validation
curl -X POST \
  https://your-project.supabase.co/functions/v1/deepgram-auth \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"action": "validate_usage"}'
```

## Usage Quotas (Optional)

Set usage quotas for users in the `profiles` table:

```sql
-- Set quota of 60 minutes per month for a user
UPDATE profiles 
SET deepgram_usage_quota = 60 
WHERE id = 'user_uuid';

-- Reset usage for all users (run monthly)
SELECT reset_monthly_deepgram_usage();
```

## Frontend Integration

### Basic Usage

```typescript
import { useDeepgramRecording } from '@/hooks/useDeepgram';

function VoiceComponent() {
  const {
    isRecording,
    isConnected,
    transcripts,
    currentTranscript,
    startRecording,
    stopRecording,
    error
  } = useDeepgramRecording({
    config: {
      model: 'nova-2',
      language: 'en',
      smart_format: true
    },
    onTranscript: (result) => {
      console.log('Transcript:', result.transcript);
    }
  });

  return (
    <div>
      <button 
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!isConnected}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      {currentTranscript && (
        <p>Current: {currentTranscript}</p>
      )}
      
      {transcripts.map((transcript, index) => (
        <p key={index}>{transcript.transcript}</p>
      ))}
      
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### File Processing

```typescript
import { useDeepgramFileProcessing } from '@/hooks/useDeepgram';

function FileUpload() {
  const { processFile, isProcessing, result, error } = useDeepgramFileProcessing();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      
      {isProcessing && <p>Processing...</p>}
      
      {result.map((transcript, index) => (
        <p key={index}>{transcript.transcript}</p>
      ))}
      
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Advanced Configuration

```typescript
const deepgram = useDeepgram({
  config: {
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    punctuate: true,
    diarize: false
  },
  onTranscript: (result) => {
    if (result.is_final) {
      // Handle final transcript
      console.log('Final:', result.transcript);
    } else {
      // Handle interim results
      console.log('Interim:', result.transcript);
    }
  },
  onError: (error) => {
    console.error('Deepgram error:', error);
  },
  autoConnect: true
});
```

## Security Features

### 1. API Key Management
- API keys are stored securely in Supabase Edge Functions
- Temporary tokens are generated for client connections
- Fallback to environment variables if Edge Functions fail

### 2. Rate Limiting
- Built-in rate limiting per user per endpoint
- Configurable limits and windows
- Automatic cleanup of old rate limit records

### 3. Usage Monitoring
- Real-time usage tracking
- Monthly quota enforcement
- Detailed usage logs with metadata

### 4. Authentication
- All endpoints require valid Supabase authentication
- Row-level security on usage tables
- User-specific data isolation

## Monitoring and Analytics

### Usage Dashboard

View usage statistics:

```sql
-- Get user's usage summary
SELECT * FROM get_deepgram_usage_summary('user_uuid');

-- Get top users by usage
SELECT 
  u.email,
  p.deepgram_usage_current,
  p.deepgram_usage_quota
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.deepgram_usage_current DESC
LIMIT 10;

-- Get daily usage trends
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as sessions,
  SUM(duration) as total_minutes
FROM deepgram_usage_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

### Rate Limit Monitoring

```sql
-- Check rate limit status
SELECT 
  endpoint,
  COUNT(*) as active_limits,
  AVG(request_count) as avg_requests
FROM deepgram_rate_limits
WHERE window_start >= NOW() - INTERVAL '1 hour'
GROUP BY endpoint;
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check API key validity
   - Verify network connectivity
   - Check rate limits and quotas

2. **Audio Quality Issues**
   - Ensure proper microphone permissions
   - Check sample rate (16kHz recommended)
   - Verify encoding format

3. **Usage Tracking Issues**
   - Check Edge Function logs
   - Verify database permissions
   - Check RLS policies

### Debug Mode

Enable debug logging:

```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Edge Function Logs

```bash
# View function logs
supabase functions logs deepgram-auth
supabase functions logs deepgram-websocket
```

## Performance Optimization

### 1. Connection Pooling
- Reuse WebSocket connections when possible
- Implement connection state management
- Use heartbeat to maintain connections

### 2. Audio Optimization
- Use appropriate sample rates (16kHz for speech)
- Implement VAD (Voice Activity Detection)
- Buffer audio to reduce network calls

### 3. Caching
- Cache API tokens until expiry
- Implement local storage for user preferences
- Cache usage status to reduce API calls

## Production Considerations

### 1. Scaling
- Monitor Edge Function performance
- Implement connection limits per user
- Use CDN for static assets

### 2. Backup and Recovery
- Regular database backups
- Export usage data for analytics
- Implement graceful degradation

### 3. Compliance
- Review data retention policies
- Implement GDPR compliance if needed
- Document data processing procedures

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Check Deepgram API status
4. Verify environment configuration

## Additional Resources

- [Deepgram API Documentation](https://developers.deepgram.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)