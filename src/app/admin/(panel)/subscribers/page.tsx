import ConfirmButton from '@/components/admin/ConfirmButton';
import { adminSubscribers } from '@/lib/adminData';
import { fmtDateTime } from '@/lib/adminTools';
import { deleteSubscriber } from '../../actions';

export default async function SubscribersAdmin() {
  const subs = await adminSubscribers();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl text-gold">Subscribers <span className="text-lg text-mute">({subs.length})</span></h1>
        <a href="/api/admin/export?type=subscribers" className="btn-outline !py-2 text-xs">Download CSV</a>
      </div>
      <p className="max-w-2xl text-sm text-mute">Email addresses collected by the newsletter box on your website. Only contact people who signed up, and let them unsubscribe when they ask.</p>
      {subs.length === 0 ? (
        <p className="text-mute">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold/25 bg-coal">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-mute"><tr><th className="p-3">Email</th><th>Subscribed</th><th /></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-gold/10">
                  <td className="p-3"><a href={`mailto:${s.email}`} className="hover:text-gold">{s.email}</a></td>
                  <td className="text-mute">{fmtDateTime(s.createdAt)}</td>
                  <td className="pr-3 text-right">
                    <form action={deleteSubscriber}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message={`Remove ${s.email} from the list?`} className="text-xs text-red-400 underline underline-offset-4">Remove</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
