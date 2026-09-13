import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardScreen extends ConsumerWidget {
 const DashboardScreen({super.key});

 @override
 Widget build(BuildContext context, WidgetRef ref) {
 return Scaffold(
 appBar: AppBar(title: const Text('Dashboard'), actions: [
 IconButton(icon: const Icon(Icons.logout), onPressed: () {
 // TODO: Sign out
 }),
 ]),
 body: ListView(
 padding: const EdgeInsets.all(16),
 children: [
 Row(
 children: [
 Expanded(
 child: _StatCard(title: 'Trust Score', value: '4.2', icon: Icons.verified, color: Colors.green),
 ),
 const SizedBox(width: 12),
 Expanded(
 child: _StatCard(title: 'Jobs Done', value: '47', icon: Icons.work, color: Colors.blue),
 ),
 ],
 ),
 const SizedBox(height: 12),
 Row(
 children: [
 Expanded(
 child: _StatCard(title: 'Rating', value: '4.5', icon: Icons.star, color: Colors.orange),
 ),
 const SizedBox(width: 12),
 Expanded(
 child: _StatCard(title: 'Earnings', value: '₹12.4K', icon: Icons.account_balance_wallet, color: Colors.purple),
 ),
 ],
 ),
 const SizedBox(height: 20),
 const Text('Today\'s Jobs', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
 const SizedBox(height: 12),
 Card(
 child: ListTile(
 leading: const Icon(Icons.electrical_services, color: Colors.orange),
 title: const Text('Electrical Repair'),
 subtitle: const Text('Rajesh K. · 10:00 AM'),
 trailing: ElevatedButton(onPressed: () {}, child: const Text('Start')),
 ),
 ),
 const SizedBox(height: 8),
 Card(
 child: ListTile(
 leading: const Icon(Icons.plumbing, color: Colors.blue),
 title: const Text('Plumbing'),
 subtitle: const Text('Priya S. · 2:00 PM'),
 trailing: OutlinedButton(onPressed: () {}, child: const Text('Details')),
 ),
 ),
 ],
 ),
 );
 }
}

class _StatCard extends StatelessWidget {
 final String title;
 final String value;
 final IconData icon;
 final Color color;

 const _StatCard({required this.title, required this.value, required this.icon, required this.color});

 @override
 Widget build(BuildContext context) {
 return Container(
 padding: const EdgeInsets.all(16),
 decoration: BoxDecoration(
 color: color.withOpacity(0.1),
 borderRadius: BorderRadius.circular(16),
 border: Border.all(color: color.withOpacity(0.3)),
 ),
 child: Column(
 crossAxisAlignment: CrossAxisAlignment.start,
 children: [
 Icon(icon, color: color, size: 24),
 const SizedBox(height: 8),
 Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
 Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
 ],
 ),
 );
 }
}
