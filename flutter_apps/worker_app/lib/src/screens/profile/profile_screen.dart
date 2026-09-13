import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
 const ProfileScreen({super.key});

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('My Profile')),
 body: ListView(
 padding: const EdgeInsets.all(16),
 children: [
 Center(
 child: CircleAvatar(
 radius: 48,
 backgroundColor: const Color(0xFFef4d23),
 child: const Text('RK', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
 ),
 ),
 const SizedBox(height: 16),
 Center(child: Text('Rajesh Kumar', style: Theme.of(context).textTheme.headlineSmall)),
 Center(child: Text('Electrician · 5 yrs exp', style: TextStyle(color: Colors.grey[600]))),
 const SizedBox(height: 24),
 Row(
 children: [
 Expanded(child: _StatTile(title: 'Trust Score', value: '4.2')),
 const SizedBox(width: 12),
 Expanded(child: _StatTile(title: 'Jobs', value: '47')),
 ],
 ),
 const SizedBox(height: 24),
 const Text('Skills', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 Wrap(
 spacing: 8,
 children: const [
 Chip(label: Text('Fan Repair')), Chip(label: Text('Wiring')), Chip(label: Text('Switch')), Chip(label: Text('Light')),
 ],
 ),
 const SizedBox(height: 24),
 const Text('Cooperative', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
 const SizedBox(height: 8),
 Card(
 child: ListTile(
 title: const Text('ABC Electrical Co-op'),
 subtitle: const Text('Member since 2024'),
 trailing: const Icon(Icons.verified, color: Colors.green),
 ),
 ),
 const SizedBox(height: 24),
 FilledButton.icon(
 onPressed: () {},
 icon: const Icon(Icons.edit),
 label: const Text('Edit Profile'),
 ),
 const SizedBox(height: 8),
 OutlinedButton.icon(
 onPressed: () {},
 icon: const Icon(Icons.settings),
 label: const Text('Settings'),
 ),
 ],
 ),
 );
 }
}

class _StatTile extends StatelessWidget {
 final String title;
 final String value;

 const _StatTile({required this.title, required this.value});

 @override
 Widget build(BuildContext context) {
 return Card(
 child: Padding(
 padding: const EdgeInsets.all(16),
 child: Column(
 children: [
 Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
 Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
 ],
 ),
 ),
 );
 }
}
