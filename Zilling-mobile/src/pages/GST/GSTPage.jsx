import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Download, TrendingUp, DollarSign, Percent, FileText } from 'lucide-react-native';
import { useTransactions } from '../../context/TransactionContext';
import Svg, { Circle, G, Path, Text as SvgText, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- Charts Components ---

const DonutChart = ({ data, size = 160, strokeWidth = 20 }) => {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let startAngle = -90;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={center} cy={center} r={radius}
                    stroke="#f1f5f9" strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {data.map((item, index) => {
                    const strokeDashoffset = circumference - (circumference * item.value) / (total || 1);
                    const angle = (item.value / (total || 1)) * 360;

                    const el = (
                        <Circle
                            key={index}
                            cx={center} cy={center} r={radius}
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            rotation={startAngle}
                            origin={`${center}, ${center}`}
                        />
                    );
                    startAngle += angle;
                    return el;
                })}
                {/* Center Text */}
                <SvgText
                    x={center} y={center - 10}
                    fill="#64748b" fontSize="12" fontWeight="600"
                    textAnchor="middle" alignmentBaseline="middle"
                >
                    Total Tax
                </SvgText>
                <SvgText
                    x={center} y={center + 12}
                    fill="#0f172a" fontSize="18" fontWeight="800"
                    textAnchor="middle" alignmentBaseline="middle"
                >
                    ₹{total.toLocaleString()}
                </SvgText>
            </Svg>

            {/* Legend */}
            <View style={styles.legendContainer}>
                {data.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendLabel}>{item.label}</Text>
                        <Text style={styles.legendValue}>{Math.round((item.value / (total || 1)) * 100)}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const LineChart = ({ data, width: chartWidth = width - 80, height = 180 }) => {
    if (!data || data.length < 2) return null;

    const padding = 20;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = height - padding * 2;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = 0;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * graphWidth + padding;
        const y = graphHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * graphHeight + padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <Svg width={chartWidth} height={height}>
                <Defs>
                    <SvgGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#2563eb" stopOpacity="0.2" />
                        <Stop offset="1" stopColor="#2563eb" stopOpacity="0" />
                    </SvgGradient>
                </Defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                    <Line
                        key={i}
                        x1={padding} y1={graphHeight * t + padding}
                        x2={chartWidth - padding} y2={graphHeight * t + padding}
                        stroke="#e2e8f0" strokeWidth="1"
                    />
                ))}

                {/* The Line */}
                <Path
                    d={`M${points}`}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Area under line (optional, simplified for 'clear' look) */}
                <Path
                    d={`M${padding},${graphHeight + padding} L${data.map((d, i) => {
                        const x = (i / (data.length - 1)) * graphWidth + padding;
                        const y = graphHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * graphHeight + padding;
                        return `${x},${y}`;
                    }).join(' ')} L${chartWidth - padding},${graphHeight + padding} Z`}
                    fill="url(#gradient)"
                    stroke="none"
                />
            </Svg>
            <View style={styles.chartLabels}>
                {data.map((d, i) => (i % 2 === 0 || i === data.length - 1) && (
                    <Text key={i} style={[styles.dateLabel, { left: (i / (data.length - 1)) * 100 + '%' }]}>
                        {d.label}
                    </Text>
                ))}
            </View>
        </View>
    );
};

// --- Main Page ---

const GSTCard = ({ title, amount, color, icon: Icon }) => (
    <View style={styles.gstCard}>
        <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
            <Icon size={20} color={color} />
        </View>
        <View>
            <Text style={styles.cardLabel}>{title}</Text>
            <Text style={[styles.cardValue, { color }]}>₹{amount.toLocaleString()}</Text>
        </View>
    </View>
);

export default function GSTPage() {
    const navigation = useNavigation();
    const { transactions } = useTransactions();
    const [period, setPeriod] = useState('This Month');

    const gstData = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let filtered = transactions;
        if (period === 'This Month') {
            filtered = transactions.filter(t => new Date(t.date) >= startOfMonth);
        }

        let totalSales = 0;
        let totalGST = 0;
        let sgst = 0;
        let cgst = 0;
        let igst = 0;

        // Daily aggregation for Line Chart
        const dailyMap = {};

        filtered.forEach(t => {
            const tax = t.taxAmount || 0;

            // Estimating split if not present (Demo Logic)
            let t_sgst = 0, t_cgst = 0, t_igst = 0;
            if (t.taxDetails) {
                t_sgst = t.taxDetails.sgst || 0;
                t_cgst = t.taxDetails.cgst || 0;
                t_igst = t.taxDetails.igst || 0;
            } else {
                t_sgst = tax / 2;
                t_cgst = tax / 2;
            }

            totalSales += (t.total || 0);
            totalGST += tax;
            sgst += t_sgst;
            cgst += t_cgst;
            igst += t_igst;

            // Trend Data
            const d = new Date(t.date || Date.now());
            const dayKey = `${d.getDate()}/${d.getMonth() + 1}`;
            if (!dailyMap[dayKey]) dailyMap[dayKey] = 0;
            dailyMap[dayKey] += tax;
        });

        // Format trend data
        const trendData = Object.keys(dailyMap).length > 0
            ? Object.entries(dailyMap).map(([label, value]) => ({ label, value }))
            : [{ label: 'Start', value: 0 }, { label: 'Now', value: 0 }]; // Empty state fallback

        return { totalSales, totalGST, sgst, cgst, igst, trendData };
    }, [transactions, period]);

    const pieData = [
        { label: 'SGST', value: gstData.sgst, color: '#e11d48' },
        { label: 'CGST', value: gstData.cgst, color: '#0891b2' },
        { label: 'IGST', value: gstData.igst, color: '#d97706' },
    ].filter(d => d.value > 0);

    // If no data, show a placeholder segment
    if (pieData.length === 0) pieData.push({ label: 'No Data', value: 1, color: '#e2e8f0' });

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>GST Reports</Text>
                    <Pressable style={styles.downloadBtn}>
                        <Download size={20} color="#000" />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        {['This Month', 'All Time'].map(p => (
                            <Pressable
                                key={p}
                                onPress={() => setPeriod(p)}
                                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                            >
                                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.summaryGrid}>
                        <View style={styles.fullWidthCard}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.totalLabel}>Total Sales (Inc. Tax)</Text>
                                <TrendingUp size={20} color="#22c55e" />
                            </View>
                            <Text style={styles.bigAmount}>₹{gstData.totalSales.toLocaleString()}</Text>
                            <Text style={styles.subText}>Top line revenue</Text>
                        </View>

                        <View style={styles.gstGrid}>
                            <GSTCard title="Total GST" amount={gstData.totalGST} color="#6366f1" icon={Percent} />
                            <GSTCard title="SGST" amount={gstData.sgst} color="#e11d48" icon={DollarSign} />
                            <GSTCard title="CGST" amount={gstData.cgst} color="#0891b2" icon={DollarSign} />
                            <GSTCard title="IGST" amount={gstData.igst} color="#d97706" icon={DollarSign} />
                        </View>
                    </View>

                    {/* Tax Breakdown (Donut Chart) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tax Composition</Text>
                        <View style={styles.chartCard}>
                            <DonutChart data={pieData} />
                        </View>
                    </View>

                    {/* Trend (Line Chart) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Collection Trend</Text>
                        <View style={styles.chartCard}>
                            <LineChart data={gstData.trendData} />
                        </View>
                    </View>

                    {/* Essential Info */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <FileText size={20} color="#64748b" />
                            <Text style={styles.infoTitle}>Filing Information</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>GSTR-1 Due Date</Text>
                            <Text style={styles.infoValue}>11th of Next Month</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>GSTR-3B Due Date</Text>
                            <Text style={styles.infoValue}>20th of Next Month</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    downloadBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { paddingBottom: 40 },

    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 10
    },
    periodBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    periodBtnActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a'
    },
    periodText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    periodTextActive: { color: '#fff' },

    summaryGrid: { paddingHorizontal: 20, gap: 15, marginBottom: 25 },
    fullWidthCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#64748b', shadowOpacity: 0.05, shadowRadius: 10
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    totalLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
    bigAmount: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
    subText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

    gstGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gstCard: {
        backgroundColor: '#fff',
        flex: 1,
        minWidth: '48%',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        gap: 12
    },
    iconWrapper: {
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'
    },
    cardLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: '700' },

    section: { paddingHorizontal: 20, marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 15 },
    chartCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 20,
        alignItems: 'center'
    },

    // Legend Styles
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    legendValue: { fontSize: 12, color: '#0f172a', fontWeight: '700' },

    // Line Chart Labels
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 0,
        height: 20
    },
    dateLabel: {
        color: '#94a3b8',
        fontSize: 10,
        position: 'absolute'
    },

    infoCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    infoTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 14, color: '#64748b' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 }
});
