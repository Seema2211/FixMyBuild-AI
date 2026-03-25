using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Channels;

namespace FixMyBuildApi.Services;

public interface ISseService
{
    ChannelReader<string> Subscribe(Guid orgId);
    void Unsubscribe(Guid orgId, ChannelReader<string> reader);
    Task PublishAsync(Guid orgId, string eventType, object data);
}

public class SseService : ISseService
{
    private readonly ConcurrentDictionary<Guid, List<Channel<string>>> _subs = new();

    public ChannelReader<string> Subscribe(Guid orgId)
    {
        var ch = Channel.CreateBounded<string>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.DropOldest
        });
        _subs.AddOrUpdate(orgId,
            _ => [ch],
            (_, list) => { lock (list) { list.Add(ch); } return list; });
        return ch.Reader;
    }

    public void Unsubscribe(Guid orgId, ChannelReader<string> reader)
    {
        if (!_subs.TryGetValue(orgId, out var list)) return;
        lock (list)
        {
            list.RemoveAll(c => c.Reader == reader);
            if (list.Count == 0) _subs.TryRemove(orgId, out _);
        }
    }

    public async Task PublishAsync(Guid orgId, string eventType, object data)
    {
        if (!_subs.TryGetValue(orgId, out var list)) return;

        var json = JsonSerializer.Serialize(new { type = eventType, data },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        List<Channel<string>> snapshot;
        lock (list) snapshot = [.. list];

        foreach (var ch in snapshot)
        {
            try { ch.Writer.TryWrite(json); } catch { }
        }

        await Task.CompletedTask;
    }
}
