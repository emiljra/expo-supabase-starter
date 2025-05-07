import React, { useState } from "react";
import { View, Pressable, Linking, LayoutAnimation, Platform, UIManager } from "react-native";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { Image } from "./image";
import { ExternalLink, ShieldCheck, ChevronRight } from "lucide-react-native";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CompanyCardProps = {
  data: {
    company_id: {
      company_logo: string;
      company_name: string;
      about_company: string;
      company_url: string;
      isVerified: boolean;
      org_nr: string;
      companyBranding?: {
        brandColors?: {
          backgroundColor?: string;
          textColor?: string;
        };
      };
    };
    contact_person: Array<{
      full_name: string;
      job_title: string;
      phone: string;
      email: string;
    }>;
    application_url?: string;
  };
  listingType?: string;
};

export const CompanyCard: React.FC<CompanyCardProps> = ({ data, listingType }) => {
  const { company_id, contact_person, application_url } = data;
  const {
    company_logo,
    company_name,
    about_company,
    company_url,
    isVerified,
    org_nr,
    companyBranding,
  } = company_id || {};

  const bgColor = companyBranding?.brandColors?.backgroundColor || "#e7f2f8";
  const textColor = companyBranding?.brandColors?.textColor || "#000";

  const [aboutOpen, setAboutOpen] = useState(false);

  const handleAccordionToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAboutOpen((prev) => !prev);
  };

  // Determine button and accordion labels
  const allAdsLabel = listingType === 'job'
    ? `Vis alle stillinger hos ${company_name}`
    : 'Vis alle annonser fra selger';
  const aboutLabel = listingType === 'job' ? 'Om arbeidsgiver' : 'Om selger';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: bgColor,
        borderRadius: 16,
        margin: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
        <Image
          source={{ uri: company_logo || '/Jobb.svg' }}
          style={{ width: 150, height: 60, resizeMode: 'contain' }}
        />
      </View>
      <View style={{ backgroundColor: bgColor, padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: textColor, marginBottom: 8 }}>
          {company_name || 'Firmanavn mangler'}
        </Text>
        {contact_person?.map((person, idx) => (
          <View key={idx} style={{ marginBottom: contact_person.length > 1 ? 16 : 0 }}>
            <Text style={{ fontWeight: 'bold', color: textColor }}>{person.full_name}</Text>
            <Text style={{ fontSize: 12, color: textColor }}>{person.job_title}</Text>
            <Pressable onPress={() => Linking.openURL(`tel:${person.phone}`)}>
              <Text style={{ color: '#007AFF' }}>{person.phone}</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(`mailto:${person.email}`)}>
              <Text style={{ color: '#007AFF' }}>{person.email}</Text>
            </Pressable>
          </View>
        ))}
        {company_url ? (
          <Pressable onPress={() => Linking.openURL(company_url)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: textColor, textDecorationLine: 'underline' }}>Hjemmeside</Text>
            <ExternalLink size={14} color={textColor} style={{ marginLeft: 4 }} />
          </Pressable>
        ) : null}
      </View>
      {about_company ? (
        <View style={{ borderTopWidth: 1, borderColor: bgColor }}>
          <Pressable onPress={handleAccordionToggle} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <Text style={{ fontWeight: 'bold', color: '#222' }}>{aboutLabel}</Text>
            <ChevronRight size={18} style={{ transform: [{ rotate: aboutOpen ? '90deg' : '0deg' }] }} />
          </Pressable>
          {aboutOpen && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ color: '#444' }}>{about_company}</Text>
            </View>
          )}
        </View>
      ) : null}
      <View style={{ borderTopWidth: 1, borderColor: bgColor, alignItems: 'center', padding: 12 }}>
        {isVerified && (
          <Button
            variant="link"
            onPress={() => Linking.openURL(`https://w2.brreg.no/enhet/sok/detalj.jsp?orgnr=${org_nr}`)}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
          >
            <ShieldCheck size={16} color="#007AFF" />
            <Text style={{ marginLeft: 4, color: '#007AFF' }}>Verifisert bedrift</Text>
          </Button>
        )}
        <Button
          variant="link"
          onPress={() => Linking.openURL(`/bedrift/${org_nr}`)}
          style={{ marginBottom: 4 }}
        >
          <Text>{allAdsLabel}</Text>
        </Button>
        {application_url && (
          <Button
            variant="link"
            onPress={() => Linking.openURL(application_url)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text>Søk på stilling</Text>
            <ExternalLink size={16} style={{ marginLeft: 4 }} />
          </Button>
        )}
      </View>
    </View>
  );
};

export default CompanyCard; 