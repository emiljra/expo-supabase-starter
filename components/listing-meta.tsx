import React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { Listing, BorsenListing } from '@/app/(protected)/listing/[type]/[id]';

interface ListingMetaProps {
  data: Listing;
  type: 'job' | 'borsen' | 'vessel';
}

const conditionLabels: Record<string, string> = {
  'new': 'Ny',
  'used': 'Brukt',
  'new_used': 'Brukt, men som ny',
  'broken': 'Defekt',
};

function isBorsenListing(listing: Listing): listing is BorsenListing {
  return listing.type === 'borsen';
}

export default function ListingMeta({ data }: ListingMetaProps) {
  if (data.type === 'job') {
    const metaItems = [
      { label: 'Arbeidsgiver', value: data.company_id?.company_name },
      { label: 'Stillingstittel', value: data.title },
      {
        label: 'Søknadsfrist',
        value: data.application_due
          ? new Date(data.application_due).toLocaleDateString('nb-NO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : 'Ingen frist oppgitt',
      },
      { label: 'Lokasjon', value: data.kommune_fk?.kommunenavn || 'Ukjent lokasjon' },
    ];
    return (
      <View style={{ width: '100%', marginTop: 16, backgroundColor: '#e7f2f8', borderRadius: 12, padding: 12 }}>
        {metaItems.map(({ label, value }) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#666' }}>{label}:</Text>
            <Text style={{ fontWeight: '500', marginLeft: 8 }}>{value}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (data.type === 'borsen') {
    const formattedPrice = data.price
      ? new Intl.NumberFormat('nb-NO', {
          style: 'currency',
          currency: 'NOK',
          maximumFractionDigits: 0,
        }).format(data.price)
      : 'Pris ikke oppgitt';

    const metaItems = [
      { label: 'Selger', value: data.company_id?.company_name || 'Ukjent selger' },
      { label: 'Kategori', value: isBorsenListing(data) ? data.borsen_category || 'Ukjent kategori' : 'Ukjent kategori' },
      { label: 'Lokasjon', value: data.kommune_fk?.kommunenavn || 'Ukjent lokasjon' },
    ];

    return (
      <View style={{ width: '100%', marginTop: 16, backgroundColor: '#e7f2f8', borderRadius: 12, padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#666' }}>Pris:</Text>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{formattedPrice}</Text>
        </View>
        {metaItems.map(({ label, value }) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#666' }}>{label}:</Text>
            <Text style={{ fontWeight: '500', marginLeft: 8 }}>{value}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (data.type === 'vessel') {
    const formattedPrice = data.price
      ? new Intl.NumberFormat('nb-NO', {
          style: 'currency',
          currency: 'NOK',
          maximumFractionDigits: 0,
        }).format(data.price)
      : 'Pris ikke oppgitt';

    const metaItems = [
      { label: 'Selger', value: data.company_id?.company_name || 'Ukjent selger' },
      { label: 'Kategori', value: data.title || 'Ukjent kategori' },
      { label: 'Lokasjon', value: data.kommune_fk?.kommunenavn || 'Ukjent lokasjon' },
    ];

    return (
      <View style={{ width: '100%', marginTop: 16, backgroundColor: '#e7f2f8', borderRadius: 12, padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#666' }}>Pris:</Text>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>{formattedPrice}</Text>
        </View>
        {metaItems.map(({ label, value }) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#666' }}>{label}:</Text>
            <Text style={{ fontWeight: '500', marginLeft: 8 }}>{value}</Text>
          </View>
        ))}
      </View>
    );
  }

  return null;
} 