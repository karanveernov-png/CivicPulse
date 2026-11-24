import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const PALETTE = ['#2258CF', '#15803D', '#CA8A04', '#DC2626', '#7C3AED', '#0E7490', '#B45309', '#64748B']

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={2} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="count" stroke="#2258CF" strokeWidth={2} dot={false} name="Reports" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }: { data: { name: string; value: number }[] }) {
  const colors: Record<string, string> = {
    reported: '#6B7280', verified: '#2563EB', in_progress: '#B45309',
    resolved: '#15803D', rejected: '#B91C1C', reopened: '#C2410C',
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2}>
          {data.map((d) => <Cell key={d.name} fill={colors[d.name] ?? '#64748B'} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function WardBarChart({ data }: { data: { ward: string; open: number; resolved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" vertical={false} />
        <XAxis dataKey="ward" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="open" stackId="a" fill="#B45309" name="Open" radius={[0, 0, 0, 0]} />
        <Bar dataKey="resolved" stackId="a" fill="#15803D" name="Resolved" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
