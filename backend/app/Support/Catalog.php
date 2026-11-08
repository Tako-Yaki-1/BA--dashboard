<?php

namespace App\Support;

/* Shared seed vocabulary moved from database/seeders so validation and the meta endpoint share one source. */

/**
 * Shared seed vocabulary: the exact strings the analytics and UI rely on.
 * Keeping them in one place means the seeders, filters, and chart colors always agree.
 */
class Catalog
{
    public const CHANNELS = [
        'Facebook and Instagram Ads',
        'TikTok Creator Collabs',
        'Discord and Gaming Community Sponsorships',
        'Campus Pop-up Booths',
    ];

    public const CATEGORIES = [
        'Keyboard Kits',
        'Switches',
        'Keycap Sets',
        'Deskmats and Accessories',
        'Mod Parts and Tools',
    ];

    public const CUSTOMER_TYPES = ['Student', 'Gamer', 'Office Worker', 'Hobbyist'];

    public const LOYALTY_TIERS = ['Bronze', 'Silver', 'Gold'];

    public const PAYMENT_METHODS = ['GCash', 'Maya', 'Cash on Delivery', 'Card'];

    public const CITIES = [
        'Quezon City', 'Manila', 'Makati', 'Taguig', 'Parañaque', 'Cebu City',
        'Davao City', 'Baguio', 'Antipolo', 'Las Piñas', 'Pasig', 'Bacolod',
    ];

    /** name, category, price, cost — prices in PHP pesos. */
    public const PRODUCTS = [
        // Keyboard Kits
        ['Clack Wave 75 Barebones Kit', 'Keyboard Kits', 6900, 4100],
        ['Clack Nova 65 Barebones Kit', 'Keyboard Kits', 4200, 2500],
        ['Skyline TKL Aluminum Kit', 'Keyboard Kits', 9200, 6100],
        ['Pebble 60 Gasket Kit (Acrylic)', 'Keyboard Kits', 3150, 1900],
        ['Big Switch Typing Class Kit', 'Keyboard Kits', 2600, 1550],
        ['Clack Studio 68 Hotswap Kit', 'Keyboard Kits', 3900, 2300],
        ['Meridian 98 Wireless Kit', 'Keyboard Kits', 7300, 4600],
        ['Orbit75 Low-Profile Kit', 'Keyboard Kits', 5400, 3300],
        ['Typist Starter 61 Kit', 'Keyboard Kits', 1950, 1100],
        ["Founder's TKL Build Kit", 'Keyboard Kits', 11500, 7500],
        // Switches
        ['Gateron Oil King Switches (100x)', 'Switches', 1150, 760],
        ['Gateron Baby Kangaroo Tactile (100x)', 'Switches', 980, 640],
        ['HMX Jammy Switches (100x)', 'Switches', 1300, 850],
        ['KTT Kang White V3 (100x)', 'Switches', 820, 530],
        ['TTC Bluish White V2 (100x)', 'Switches', 760, 490],
        ['HMX Silent Whale V2 (100x)', 'Switches', 1420, 930],
        ['Gateron Smoothie 45 Linear (100x)', 'Switches', 1050, 690],
        ['Akko Cream Yellow Pro (100x)', 'Switches', 640, 410],
        ['Outemu Sand Tactile (70x)', 'Switches', 430, 270],
        ['Gateron Magnetic Jade Pro (35x)', 'Switches', 1680, 1100],
        ['Kailh Box Navy (90x)', 'Switches', 1240, 800],
        ['Cherry MX Silent Red (70x)', 'Switches', 980, 620],
        ['Tecsee Ice Candy (60x)', 'Switches', 540, 340],
        ['HMX Macchiato Switches (45x)', 'Switches', 720, 460],
        // Keycap Sets
        ['Café Latte Double-Shot PBT Set', 'Keycap Sets', 1480, 950],
        ['Halocheck Dye-Sub PBT Set', 'Keycap Sets', 1290, 830],
        ['Matcha Milk 132-Key Set', 'Keycap Sets', 1650, 1050],
        ['Tokyo Nights 125-Key Set', 'Keycap Sets', 1720, 1100],
        ['Blanc Noir 104-Key Set', 'Keycap Sets', 980, 610],
        ['Blossom Breeze 127-Key Set', 'Keycap Sets', 1560, 990],
        ['Deep Ocean 130-Key Set', 'Keycap Sets', 1380, 880],
        ['Retro Beige 104-Key Set', 'Keycap Sets', 1050, 660],
        ['Campus Pop 110-Key Set', 'Keycap Sets', 890, 560],
        ['Katakana 129-Key Set', 'Keycap Sets', 1690, 1070],
        ['Skyward 104-Key Set', 'Keycap Sets', 760, 480],
        ['Fruit Salad Mini 65-Key Set', 'Keycap Sets', 640, 400],
        // Deskmats and Accessories
        ['Clack Wave Deskmat 900x400', 'Deskmats and Accessories', 650, 380],
        ['Sound Check Deskmat 800x300', 'Deskmats and Accessories', 550, 310],
        ['Switch Tester (12 slots)', 'Deskmats and Accessories', 320, 180],
        ['Lube Station Mat + Tray', 'Deskmats and Accessories', 480, 270],
        ['Wrist Rest (Wood, 60%)', 'Deskmats and Accessories', 720, 420],
        ['Keycap Puller (Wire)', 'Deskmats and Accessories', 150, 80],
        ['Switch Opener (Steel)', 'Deskmats and Accessories', 260, 140],
        ['USB-C Aviator Cable (Black)', 'Deskmats and Accessories', 850, 500],
        ['Macro Pad (3-key with Knob)', 'Deskmats and Accessories', 1250, 780],
        ['Starfield Deskmat XL', 'Deskmats and Accessories', 780, 450],
        // Mod Parts and Tools
        ['Krytox GPL 205 g0 (3g)', 'Mod Parts and Tools', 240, 140],
        ['Super Lube 51004 (3ml)', 'Mod Parts and Tools', 180, 100],
        ['Gasket Foam Tape Roll', 'Mod Parts and Tools', 130, 70],
        ['Poron Custard Plate Foam', 'Mod Parts and Tools', 210, 120],
        ['Silicone Switch Films (120x)', 'Mod Parts and Tools', 190, 110],
        ['Durock Stabilizers V3 (Screw-in)', 'Mod Parts and Tools', 690, 430],
        ['Teflon Tape Roll', 'Mod Parts and Tools', 110, 60],
        ['Precision Lube Brush Set', 'Mod Parts and Tools', 330, 190],
        ['Switch Puller + Cap Grabber Combo', 'Mod Parts and Tools', 220, 120],
    ];

    public const FIRST_NAMES = [
        'Juan', 'Maria', 'Jose', 'Ana', 'Miguel', 'Sofia', 'Carlo', 'Bea',
        'Paolo', 'Camille', 'Rafael', 'Nicole', 'Gabriel', 'Trisha', 'Diego',
        'Isabelle', 'Marco', 'Jasmine', 'Enzo', 'Klara',
    ];

    public const LAST_NAMES = [
        'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres',
        'Villanueva', 'Bautista', 'Ocampo', 'Rivera', 'Aquino', 'Cruz',
    ];
}
