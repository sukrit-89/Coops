import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
 const SettingsScreen({super.key});

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 appBar: AppBar(title: const Text('Settings')),
 body: ListView(
 padding: const EdgeInsets.all(16),
 children: [
 SwitchListTile(
 title: const Text('Notifications'),
 subtitle: const Text('Receive job alerts'),
 value: true,
 onChanged: (value) {},
 ),
 SwitchListTile(
 title: const Text('Location Services'),
 subtitle: const Text('Enable GPS for job matching'),
 value: true,
 onChanged: (value) {},
 ),
 const Divider(),
 ListTile(
 title: const Text('Cooperative'),
 subtitle: const Text('ABC Electrical Co-op'),
 trailing: const Icon(Icons.arrow_forward_ios, size: 16),
 ),
 ListTile(
 title: const Text('Help & Support'),
 trailing: const Icon(Icons.arrow_forward_ios, size: 16),
 onTap: () {},
 ),
 ListTile(
 title: const Text('Privacy Policy'),
 trailing: const Icon(Icons.arrow_forward_ios, size: 16),
 onTap: () {},
 ),
 const Divider(),
 ListTile(
 title: const Text('Sign Out'),
 leading: const Icon(Icons.logout, color: Colors.red),
 onTap: () {
 // TODO: Sign out
 },
 ),
 ],
 ),
 );
 }
}
